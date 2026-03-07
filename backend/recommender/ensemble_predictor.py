"""
Tier 2 Ensemble Stock Predictor.

Combines three models for robust predictions:
- AttentionLSTM (50%) — Non-linear patterns, long sequences
- XGBoost (30%)       — Feature interactions, fast training
- ARIMA (20%)         — Linear trend + seasonality

Falls back gracefully if any model fails.
"""
import os
import numpy as np
import pandas as pd
import time
import warnings
warnings.filterwarnings('ignore')

from datetime import timedelta

try:
    from recommender.stock_predictor import (
        train_and_predict as lstm_predict,
        prepare_features,
        get_sentiment_for_ticker,
        get_cached_prediction,
        save_prediction
    )
except ImportError:
    from stock_predictor import (
        train_and_predict as lstm_predict,
        prepare_features,
        get_sentiment_for_ticker,
        get_cached_prediction,
        save_prediction
    )


# ============================================================
#  XGBOOST PREDICTOR
# ============================================================

def _xgboost_predict(df, sentiment_score=0.0, forecast_days=7):
    """
    XGBoost regression on flattened sliding-window features.
    Uses last 5 days of 13 features → predicts 7-day returns.
    """
    try:
        import xgboost as xgb
    except ImportError:
        print("[ENSEMBLE] xgboost not installed, skipping XGBoost...")
        return None

    features_df = prepare_features(df, sentiment_score=sentiment_score)
    data = features_df.values
    close_prices = df['Close'].values

    lookback = 5  # XGBoost uses short lookback (flattened)
    num_features = data.shape[1]

    # Create flattened sliding-window features
    X, y = [], []
    for i in range(lookback, len(data) - forecast_days):
        flat = data[i - lookback:i].flatten()
        # Target: percentage returns for next 7 days
        future_returns = (close_prices[i:i + forecast_days] / close_prices[i - 1]) - 1
        X.append(flat)
        y.append(future_returns)

    if len(X) < 20:
        return None

    X = np.array(X)
    y = np.array(y)

    # Train on all but last fold (time-ordered)
    split = int(len(X) * 0.85)
    X_train, X_test = X[:split], X[split:]
    y_train, y_test = y[:split], y[split:]

    # Multi-output via separate models per day
    predictions = []
    last_price = close_prices[-1]

    for day in range(forecast_days):
        model = xgb.XGBRegressor(
            n_estimators=100,
            max_depth=5,
            learning_rate=0.1,
            random_state=42,
            verbosity=0
        )
        model.fit(X_train, y_train[:, day])
        pred_return = model.predict(X[-1:].reshape(1, -1))[0]
        pred_price = last_price * (1 + pred_return)
        predictions.append(round(float(pred_price), 2))
        last_price = pred_price  # Chain predictions

    print(f"[ENSEMBLE] XGBoost predictions: {predictions}")
    return predictions


# ============================================================
#  ARIMA PREDICTOR
# ============================================================

def _arima_predict(df, forecast_days=7):
    """
    Auto-ARIMA on Close prices for trend/seasonal forecasting.
    """
    try:
        import pmdarima as pm
    except ImportError:
        print("[ENSEMBLE] pmdarima not installed, skipping ARIMA...")
        return None

    try:
        close = df['Close'].values

        # Use last 200 trading days for faster fitting
        close_subset = close[-200:] if len(close) > 200 else close

        model = pm.auto_arima(
            close_subset,
            seasonal=False,
            stepwise=True,
            suppress_warnings=True,
            error_action='ignore',
            max_p=5, max_q=5, max_d=2,
            trace=False
        )

        forecast = model.predict(n_periods=forecast_days)
        predictions = [round(float(p), 2) for p in forecast]

        print(f"[ENSEMBLE] ARIMA predictions: {predictions}")
        return predictions

    except Exception as e:
        print(f"[ENSEMBLE] ARIMA failed: {e}")
        return None


# ============================================================
#  ENSEMBLE COMBINER
# ============================================================

# Model weights
WEIGHTS = {
    'lstm': 0.70,
    'xgboost': 0.10,
    'arima': 0.20,
}


def ensemble_predict(ticker: str, lookback: int = 60, forecast_days: int = 7) -> dict:
    """
    Ensemble prediction combining LSTM + XGBoost + ARIMA.

    Returns the same format as train_and_predict() for backward compatibility:
    {
        "history": [...],
        "predictions": [...],
        "metrics": {...}
    }
    """
    import yfinance as yf

    # Check persistent DB cache first
    cached_result = get_cached_prediction(ticker)
    if cached_result:
        print(f"[ENSEMBLE] Returning DB cached ensemble result for {ticker}")
        return cached_result

    print(f"[ENSEMBLE] Processing {ticker}...")
    start_time = time.time()

    # 1. Fetch data
    stock = yf.Ticker(ticker)
    df = stock.history(period="1y")

    if df.empty or len(df) < lookback + forecast_days + 10:
        # Don't throw exception, serve a fallback similar stock prediction instead
        print(f"[ENSEMBLE] Insufficient data for {ticker}. Seeking nearest equivalent proxy.")
        similar_ticker = find_most_similar_stock(ticker)
        pred = get_cached_prediction(similar_ticker)
        if pred:
            pred['metrics']['model'] = f"Ensemble Proxy (Copied from {similar_ticker})"
            return pred
        else:
            raise ValueError(f"Insufficient data and no proxy available for {ticker}")

    sentiment_score = get_sentiment_for_ticker(ticker)

    # 2. Run each model independently
    model_predictions = {}
    active_weights = {}

    # --- LSTM (AttentionLSTM) ---
    try:
        lstm_result = lstm_predict(ticker, lookback, forecast_days)
        lstm_prices = [p['price'] for p in lstm_result['predictions']]
        model_predictions['lstm'] = lstm_prices
        active_weights['lstm'] = WEIGHTS['lstm']
        print(f"[ENSEMBLE] ✓ LSTM: {lstm_prices}")
    except Exception as e:
        print(f"[ENSEMBLE] ✗ LSTM failed: {e}")

    # --- XGBoost ---
    try:
        xgb_prices = _xgboost_predict(df, sentiment_score, forecast_days)
        if xgb_prices:
            model_predictions['xgboost'] = xgb_prices
            active_weights['xgboost'] = WEIGHTS['xgboost']
    except Exception as e:
        print(f"[ENSEMBLE] ✗ XGBoost failed: {e}")

    # --- ARIMA ---
    try:
        arima_prices = _arima_predict(df, forecast_days)
        if arima_prices:
            model_predictions['arima'] = arima_prices
            active_weights['arima'] = WEIGHTS['arima']
    except Exception as e:
        print(f"[ENSEMBLE] ✗ ARIMA failed: {e}")

    # 3. Weighted ensemble combination
    if not model_predictions:
        raise ValueError(f"All models failed for {ticker}")

    # Normalize weights of available models
    total_weight = sum(active_weights.values())
    normalized_weights = {k: v / total_weight for k, v in active_weights.items()}

    # Weighted average of predictions
    ensemble_prices = []
    for day in range(forecast_days):
        weighted_price = 0.0
        for model_name, prices in model_predictions.items():
            if day < len(prices):
                weighted_price += prices[day] * normalized_weights[model_name]
        ensemble_prices.append(round(weighted_price, 2))

    # 4. Build result (same format as stock_predictor)
    history = []
    recent_df = df.tail(30)
    for idx, row in recent_df.iterrows():
        history.append({
            "date": idx.strftime('%Y-%m-%d'),
            "price": round(float(row['Close']), 2),
            "isFuture": False
        })

    last_date = df.index[-1]
    predictions = []
    for i in range(forecast_days):
        next_date = last_date + timedelta(days=i + 1)
        while next_date.weekday() >= 5:
            next_date += timedelta(days=1)
        predictions.append({
            "date": next_date.strftime('%Y-%m-%d'),
            "price": ensemble_prices[i],
            "isFuture": True
        })

    elapsed = time.time() - start_time

    # Get LSTM metrics if available
    lstm_metrics = {}
    if 'lstm' in model_predictions:
        try:
            lstm_metrics = lstm_result.get('metrics', {})
        except Exception:
            pass

    result = {
        "history": history,
        "predictions": predictions,
        "metrics": {
            "test_mse": lstm_metrics.get('test_mse', 0),
            "walk_forward_mse": lstm_metrics.get('walk_forward_mse', 0),
            "training_samples": lstm_metrics.get('training_samples', len(df)),
            "features": lstm_metrics.get('features', 13),
            "model": "Ensemble (AttentionLSTM + XGBoost + ARIMA)",
            "models_used": list(model_predictions.keys()),
            "weights": {k: round(v, 2) for k, v in normalized_weights.items()},
            "elapsed_seconds": round(elapsed, 2),
        },
        # Include individual model predictions for transparency
        "model_breakdown": {
            name: prices for name, prices in model_predictions.items()
        }
    }

    # Save ensemble result to persistent DB
    save_prediction(ticker, result)

    print(f"[ENSEMBLE] Complete for {ticker} in {elapsed:.1f}s using {list(model_predictions.keys())}")
    return result


if __name__ == "__main__":
    result = ensemble_predict("RELIANCE.NS")
    print(f"\nHistory points: {len(result['history'])}")
    print(f"Predictions: {len(result['predictions'])}")
    print(f"Metrics: {result['metrics']}")
    print(f"\nModel Breakdown:")
    for model, prices in result['model_breakdown'].items():
        print(f"  {model}: {prices}")
    print(f"\nEnsemble Prices:")
    for p in result['predictions']:
        print(f"  {p['date']}: ₹{p['price']}")
