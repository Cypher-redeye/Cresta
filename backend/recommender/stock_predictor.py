"""
Tier 2 LSTM Stock Price Predictor — Orchestrator Module.

Coordinates the full prediction pipeline:
1. Check DB cache → 2. Fetch data → 3. Engineer features →
4. Train with walk-forward validation → 5. Predict with Monte Carlo Dropout.

Model architecture, feature engineering, validation, and persistence
are handled by dedicated submodules.
"""
import numpy as np
import torch
import torch.nn as nn
import yfinance as yf
from sklearn.preprocessing import MinMaxScaler
from datetime import timedelta

from .models.attention_lstm import AttentionLSTM, StockLSTM  # noqa: F401
from .features import prepare_features  # noqa: F401 (re-exported for backward compat)
from .validation import walk_forward_split, create_sequences  # noqa: F401
from .persistence import (  # noqa: F401 (re-exported for backward compat)
    get_cached_prediction,
    save_prediction,
    save_model,
    load_saved_model,
    CACHE_DURATION,
)

import logging
logger = logging.getLogger(__name__)


def set_seed(seed=42):
    """Set random seeds for reproducibility."""
    import random
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    torch.backends.cudnn.deterministic = True
    torch.backends.cudnn.benchmark = False


def get_sentiment_for_ticker(ticker):
    """Get cached sentiment score for a ticker (0.0 if unavailable)."""
    try:
        from advisor.tasks import get_cached_sentiment
        data = get_cached_sentiment(ticker)
        return data.get('score', 0.0)
    except Exception:
        try:
            from recommender.sentiment import get_market_sentiment
            data = get_market_sentiment(ticker)
            return data.get('score', 0.0)
        except Exception:
            return 0.0


def train_and_predict(ticker: str, lookback: int = 60, forecast_days: int = 7) -> dict:
    """
    Fetch real data, train AttentionLSTM with walk-forward validation,
    and predict next 7 days.
    Uses saved models when available, otherwise trains from scratch.
    Returns dict with 'history' and 'predictions'.
    """
    set_seed(42)
    # Check persistent DB cache
    cached_result = get_cached_prediction(ticker)
    if cached_result:
        print(f"[LSTM] Returning DB cached result for {ticker}")
        return cached_result

    print(f"[LSTM] Processing {ticker}...")

    # 1. Fetch 1 year of real data
    stock = yf.Ticker(ticker)
    df = stock.history(period="1y")

    if df.empty or len(df) < lookback + forecast_days + 10:
        raise ValueError(f"Insufficient data for {ticker}. Need at least {lookback + forecast_days + 10} days.")

    # 2. Get sentiment score
    sentiment_score = get_sentiment_for_ticker(ticker)

    # 3. Prepare extended features (13+ features)
    features_df = prepare_features(df, sentiment_score=sentiment_score)
    feature_columns = features_df.columns.tolist()
    num_features = len(feature_columns)

    # 4. Scale data
    scaler = MinMaxScaler()
    scaled_data = scaler.fit_transform(features_df.values)

    # 5. Try loading a pre-trained model from disk
    model, loaded_scaler = load_saved_model(ticker, num_features)
    test_loss_val = 0.0
    wf_mse = 0.0

    if model is not None and loaded_scaler is not None:
        # Use loaded model
        pass
    else:
        # Train from scratch with walk-forward validation
        print(f"[LSTM] Training new AttentionLSTM for {ticker} ({num_features} features)...")

        X, y = create_sequences(scaled_data, lookback, forecast_days)

        if len(X) < 10:
            raise ValueError(f"Not enough sequences for training {ticker}.")

        # --- Walk-Forward Validation ---
        splits = walk_forward_split(X, y, n_folds=3)
        fold_losses = []

        for fold_idx, ((X_tr, y_tr), (X_te, y_te)) in enumerate(splits):
            fold_model = AttentionLSTM(
                input_size=num_features, hidden_size=64,
                num_layers=2, output_size=forecast_days
            )
            criterion = nn.MSELoss()
            optimizer = torch.optim.Adam(fold_model.parameters(), lr=0.001)

            X_tr_t = torch.FloatTensor(X_tr)
            y_tr_t = torch.FloatTensor(y_tr)
            X_te_t = torch.FloatTensor(X_te)
            y_te_t = torch.FloatTensor(y_te)

            fold_model.train()
            for epoch in range(30):
                optimizer.zero_grad()
                output = fold_model(X_tr_t)
                loss = criterion(output, y_tr_t)
                loss.backward()
                optimizer.step()

            fold_model.eval()
            with torch.no_grad():
                test_pred = fold_model(X_te_t)
                fold_loss = criterion(test_pred, y_te_t).item()
                fold_losses.append(fold_loss)

            print(f"  Walk-Forward Fold {fold_idx+1}: MSE={fold_loss:.6f}")

        wf_mse = np.mean(fold_losses)
        print(f"  Walk-Forward Avg MSE: {wf_mse:.6f}")

        # --- Final Training on ALL data ---
        model = AttentionLSTM(
            input_size=num_features, hidden_size=64,
            num_layers=2, output_size=forecast_days
        )
        criterion = nn.MSELoss()
        optimizer = torch.optim.Adam(model.parameters(), lr=0.001)

        X_all_t = torch.FloatTensor(X)
        y_all_t = torch.FloatTensor(y)

        model.train()
        epochs = 50
        for epoch in range(epochs):
            optimizer.zero_grad()
            output = model(X_all_t)
            loss = criterion(output, y_all_t)
            loss.backward()
            optimizer.step()

            if (epoch + 1) % 10 == 0:
                print(f"  Epoch {epoch+1}/{epochs}, Loss: {loss.item():.6f}")

        model.eval()
        test_loss_val = loss.item()

        # Save model to disk
        save_model(ticker, model, scaler, num_features)

    # 6. Predict future using the last `lookback` days with Monte Carlo Dropout
    last_sequence = scaled_data[-lookback:]
    last_sequence_t = torch.FloatTensor(last_sequence).unsqueeze(0)

    # Enable dropout during inference for Monte Carlo estimates
    model.train()  

    n_samples = 50
    mc_predictions = []
    
    for _ in range(n_samples):
        with torch.no_grad():
            mc_pred = model(last_sequence_t).numpy()[0]
            mc_predictions.append(mc_pred)
            
    mc_predictions_np = np.array(mc_predictions) # Shape: (50, 7)
    
    # Calculate Mean, 10th percentile (lower), 90th percentile (upper)
    future_scaled = mc_predictions_np.mean(axis=0)
    lower_scaled = np.percentile(mc_predictions_np, 10, axis=0)
    upper_scaled = np.percentile(mc_predictions_np, 90, axis=0)

    # Inverse transform predictions mapping columns to 0
    dummy_mean = np.zeros((forecast_days, num_features))
    dummy_lower = np.zeros((forecast_days, num_features))
    dummy_upper = np.zeros((forecast_days, num_features))
    
    dummy_mean[:, 0] = future_scaled
    dummy_lower[:, 0] = lower_scaled
    dummy_upper[:, 0] = upper_scaled
    
    future_prices = scaler.inverse_transform(dummy_mean)[:, 0]
    lower_prices = scaler.inverse_transform(dummy_lower)[:, 0]
    upper_prices = scaler.inverse_transform(dummy_upper)[:, 0]

    # Build history (last 30 days)
    history = []
    recent_df = df.tail(30)
    for idx, row in recent_df.iterrows():
        history.append({
            "date": idx.strftime('%Y-%m-%d'),
            "price": round(float(row['Close']), 2),
            "isFuture": False
        })

    # Build predictions
    last_date = df.index[-1]
    predictions = []
    for i in range(forecast_days):
        next_date = last_date + timedelta(days=i + 1)
        while next_date.weekday() >= 5:
            next_date += timedelta(days=1)
        predictions.append({
            "date": next_date.strftime('%Y-%m-%d'),
            "price": round(float(future_prices[i]), 2),
            "lower_bound": round(float(lower_prices[i]), 2),
            "upper_bound": round(float(upper_prices[i]), 2),
            "isFuture": True
        })

    result = {
        "history": history,
        "predictions": predictions,
        "metrics": {
            "test_mse": round(test_loss_val, 6),
            "walk_forward_mse": round(wf_mse, 6),
            "training_samples": len(scaled_data) - lookback - forecast_days,
            "features": num_features,
            "model": "AttentionLSTM (2-layer, 64 hidden, self-attention)"
        }
    }

    # Save to persistent database
    save_prediction(ticker, result)

    print(f"[LSTM] Prediction complete for {ticker}")
    return result


if __name__ == "__main__":
    result = train_and_predict("RELIANCE.NS")
    print(f"\nHistory points: {len(result['history'])}")
    print(f"Predictions: {len(result['predictions'])}")
    print(f"Metrics: {result['metrics']}")
    print("\nFuture prices:")
    for p in result['predictions']:
        print(f"  {p['date']}: ₹{p['price']}")
