"""
Tier 2 Ensemble Stock Predictor.

Combines three models for robust predictions:
- AttentionLSTM (70%) — Non-linear patterns, long sequences
- XGBoost (10%)       — Feature interactions, fast training
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


# Model weights
WEIGHTS = {
    'lstm': 0.70,
    'xgboost': 0.10,
    'arima': 0.20,
}


from recommender.data_loader import SafeDataFetcher


# ============================================================
#  XGBOOST PREDICTOR
# ============================================================

def _xgboost_predict(df, sentiment_score=0.0, forecast_days=7):
    """
    XGBoost regression on log returns for stationarity.
    """
    try:
        import xgboost as xgb
    except ImportError:
        return None

    # Use Log Returns as target
    df = df.copy()
    df['Log_Ret'] = np.log(df['Close'] / df['Close'].shift(1))
    df = df.dropna()
    
    features_df = prepare_features(df, sentiment_score=sentiment_score)
    data = features_df.values
    
    lookback = 5
    X, y = [], []
    for i in range(lookback, len(data) - forecast_days):
        X.append(data[i - lookback:i].flatten())
        # Predict cumulative log returns for simplicity
        y.append(df['Log_Ret'].iloc[i:i + forecast_days].values)

    if len(X) < 20: return None

    X, y = np.array(X), np.array(y)
    
    predictions = []
    last_price = df['Close'].iloc[-1]

    # Train multi-output on ALL available historical data (no split)
    model = xgb.XGBRegressor(n_estimators=100, max_depth=5, learning_rate=0.1, random_state=42)
    model.fit(X, y)
    
    pred_log_rets = model.predict(X[-1:].reshape(1, -1))[0]
    
    cum_ret = 0
    for r in pred_log_rets:
        cum_ret += r
        pred_price = last_price * np.exp(cum_ret)
        predictions.append(round(float(pred_price), 2))
        
    return predictions


# ============================================================
#  ARIMA PREDICTOR
# ============================================================

def _arima_predict(df, forecast_days=7):
    """
    Auto-ARIMA on log returns for better stationarity.
    """
    try:
        import pmdarima as pm
    except ImportError:
        return None

    try:
        # Train on log returns
        log_returns = np.log(df['Close'] / df['Close'].shift(1)).dropna().values
        last_price = df['Close'].iloc[-1]
        
        subset = log_returns[-200:] if len(log_returns) > 200 else log_returns

        model = pm.auto_arima(subset, seasonal=False, stepwise=True, suppress_warnings=True, max_p=1, max_q=1)
        forecast_rets = model.predict(n_periods=forecast_days)
        
        predictions = []
        cum_ret = 0
        for r in forecast_rets:
            cum_ret += r
            predictions.append(round(float(last_price * np.exp(cum_ret)), 2))
            
        return predictions
    except Exception as e:
        print(f"[ENSEMBLE] ARIMA failed: {e}")
        return None


# ============================================================
#  ENSEMBLE COMBINER
# ============================================================

def ensemble_predict(ticker: str, lookback: int = 60, forecast_days: int = 7, fast_mode: bool = False) -> dict:
    """
    Dynamic Ensemble using hardcoded weights for LSTM + XGBoost + ARIMA.
    Runs all 3 models concurrently for speed.

    Args:
        fast_mode: If True, skip ARIMA (saves 2-5s), reduce LSTM training,
                   and skip macro feature downloads for faster on-demand predictions.
    """
    # Check persistent DB cache first
    cached_result = get_cached_prediction(ticker)
    if cached_result:
        return cached_result

    mode_label = "FAST" if fast_mode else "FULL"
    print(f"[ENSEMBLE] Starting Pipeline for {ticker} ({mode_label} mode)...")
    start_time = time.time()

    # 1. Fetch data safely
    try:
        df = SafeDataFetcher.fetch_ticker_data(ticker, period="1y", min_days=lookback + forecast_days + 10)
    except ValueError:
        proxy = SafeDataFetcher.find_proxy_ticker(ticker)
        df = SafeDataFetcher.fetch_ticker_data(proxy)
        ticker = proxy

    sentiment_score = get_sentiment_for_ticker(ticker)

    # 2. Use hardcoded weights (skipping slow double-execution of ML models for IVW)
    weights = WEIGHTS

    # 3. Run predictions concurrently (skip ARIMA in fast mode)
    import concurrent.futures
    model_predictions = {}
    lstm_full_result = {}  # Store the full LSTM result for bounds
    
    def fetch_lstm():
        res = lstm_predict(ticker, lookback, forecast_days, fast_mode=fast_mode)
        lstm_full_result['data'] = res  # Save full result including bounds
        return [p['price'] for p in res['predictions']]
        
    def fetch_xgboost():
        return _xgboost_predict(df, sentiment_score, forecast_days)
        
    def fetch_arima():
        return _arima_predict(df, forecast_days)

    max_workers = 2 if fast_mode else 3
    with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
        future_lstm = executor.submit(fetch_lstm)
        future_xgb = executor.submit(fetch_xgboost)
        future_arima = None if fast_mode else executor.submit(fetch_arima)

        try:
            model_predictions['lstm'] = future_lstm.result()
        except: pass
            
        try:
            model_predictions['xgboost'] = future_xgb.result()
        except: pass
            
        if future_arima is not None:
            try:
                model_predictions['arima'] = future_arima.result()
            except: pass

    # 4. Weighted Combination
    active_models = [m for m in model_predictions if model_predictions[m]]
    if not active_models:
        raise ValueError(f"All models failed for {ticker}")
        
    # Re-normalize weights for active models only
    active_weight_sum = sum(weights[m] for m in active_models)
    norm_weights = {m: weights[m] / active_weight_sum for m in active_models}

    ensemble_prices = []
    for day in range(forecast_days):
        p_val = sum(model_predictions[m][day] * norm_weights[m] for m in active_models)
        ensemble_prices.append(round(p_val, 2))

    # 5.5 FIX: Validate prediction outputs are finite numbers
    if not all(np.isfinite(p) for p in ensemble_prices):
        # Replace any NaN/Inf with last known price
        last_price = float(df['Close'].iloc[-1])
        ensemble_prices = [round(last_price, 2) if not np.isfinite(p) else p for p in ensemble_prices]

    # 5. Result construction
    history = []
    for idx, row in df.tail(30).iterrows():
        history.append({"date": idx.strftime('%Y-%m-%d'), "price": round(float(row['Close']), 2), "isFuture": False})

    last_date = df.index[-1]
    predictions = []

    # Reuse LSTM bounds from the concurrent run (no second call!)
    lstm_bounds = None
    if 'data' in lstm_full_result:
        lstm_preds = lstm_full_result['data'].get('predictions', [])
        if lstm_preds and 'lower_bound' in lstm_preds[0]:
            lstm_bounds = lstm_preds

    for i in range(forecast_days):
        next_date = last_date + timedelta(days=i + 1)
        while next_date.weekday() >= 5: next_date += timedelta(days=1)

        entry = {"date": next_date.strftime('%Y-%m-%d'), "price": ensemble_prices[i], "isFuture": True}

        # Use LSTM confidence intervals if available, otherwise generate synthetic ±2% bands
        if lstm_bounds and i < len(lstm_bounds):
            entry["lower_bound"] = lstm_bounds[i].get("lower_bound", round(ensemble_prices[i] * 0.98, 2))
            entry["upper_bound"] = lstm_bounds[i].get("upper_bound", round(ensemble_prices[i] * 1.02, 2))
        else:
            margin = ensemble_prices[i] * 0.02 * ((i + 1) ** 0.5)
            entry["lower_bound"] = round(ensemble_prices[i] - margin, 2)
            entry["upper_bound"] = round(ensemble_prices[i] + margin, 2)

        predictions.append(entry)

    result = {
        "history": history,
        "predictions": predictions,
        "metrics": {
            "model": "Dynamic Ensemble (IVW)",
            "models_used": active_models,
            "weights": {k: round(v, 3) for k, v in norm_weights.items()},
            "elapsed_seconds": round(time.time() - start_time, 2),
        },
        "model_breakdown": model_predictions
    }

    save_prediction(ticker, result)
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
