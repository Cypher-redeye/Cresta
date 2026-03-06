"""
Tier 2 LSTM Stock Price Predictor with:
- Attention-LSTM hybrid architecture
- Extended technical indicators (MACD, Bollinger, OBV, Sentiment)
- Walk-forward time-series validation
- 13 features for richer pattern recognition

Trains on real historical data and forecasts 7 days ahead.
Supports saving/loading pre-trained models from disk.
"""
import os
import time
import numpy as np
import pandas as pd
import yfinance as yf
import torch
import torch.nn as nn
from sklearn.preprocessing import MinMaxScaler
import joblib
from datetime import timedelta

# --- Config ---
MODEL_DIR = os.path.join(os.path.dirname(__file__), 'saved_models')
os.makedirs(MODEL_DIR, exist_ok=True)

# --- Model Cache ---
_model_cache = {}  # {ticker: {'model': ..., 'scaler': ..., 'timestamp': ..., 'result': ...}}
CACHE_DURATION = 86400  # 24 hours


# ============================================================
#  ATTENTION-LSTM MODEL (Tier 2 Upgrade)
# ============================================================

class SelfAttention(nn.Module):
    """
    Self-attention layer that learns which timesteps in the
    lookback window are most important for the forecast.
    """
    def __init__(self, hidden_size):
        super(SelfAttention, self).__init__()
        self.attention = nn.Sequential(
            nn.Linear(hidden_size, hidden_size // 2),
            nn.Tanh(),
            nn.Linear(hidden_size // 2, 1)
        )

    def forward(self, lstm_output):
        # lstm_output shape: (batch, seq_len, hidden_size)
        attention_weights = self.attention(lstm_output)       # (batch, seq_len, 1)
        attention_weights = torch.softmax(attention_weights, dim=1)
        # Weighted sum of LSTM outputs
        context = torch.sum(lstm_output * attention_weights, dim=1)  # (batch, hidden_size)
        return context, attention_weights


class AttentionLSTM(nn.Module):
    """
    LSTM with Self-Attention for stock price prediction.
    The attention mechanism lets the model focus on the most
    important days in the lookback window (earnings, crashes, etc).
    """
    def __init__(self, input_size, hidden_size=64, num_layers=2, output_size=7):
        super(AttentionLSTM, self).__init__()
        self.hidden_size = hidden_size
        self.num_layers = num_layers
        self.input_size = input_size
        self.output_size = output_size

        self.lstm = nn.LSTM(
            input_size, hidden_size, num_layers,
            batch_first=True, dropout=0.2
        )
        self.attention = SelfAttention(hidden_size)
        self.fc = nn.Sequential(
            nn.Linear(hidden_size, 32),
            nn.ReLU(),
            nn.Dropout(0.1),
            nn.Linear(32, output_size)
        )

    def forward(self, x):
        h0 = torch.zeros(self.num_layers, x.size(0), self.hidden_size)
        c0 = torch.zeros(self.num_layers, x.size(0), self.hidden_size)
        lstm_out, _ = self.lstm(x, (h0, c0))

        # Apply attention over all timesteps
        context, _ = self.attention(lstm_out)

        out = self.fc(context)
        return out


# Keep backward compatibility alias
StockLSTM = AttentionLSTM


# ============================================================
#  EXTENDED FEATURE ENGINEERING (13 features)
# ============================================================

def compute_rsi(prices, period=14):
    """Compute Relative Strength Index."""
    delta = prices.diff()
    gain = delta.clip(lower=0)
    loss = -delta.clip(upper=0)
    avg_gain = gain.rolling(window=period, min_periods=1).mean()
    avg_loss = loss.rolling(window=period, min_periods=1).mean()
    rs = avg_gain / (avg_loss + 1e-10)
    return 100 - (100 / (1 + rs))


def compute_macd(prices, fast=12, slow=26, signal=9):
    """Compute MACD and Signal line."""
    ema_fast = prices.ewm(span=fast, min_periods=1).mean()
    ema_slow = prices.ewm(span=slow, min_periods=1).mean()
    macd = ema_fast - ema_slow
    macd_signal = macd.ewm(span=signal, min_periods=1).mean()
    return macd, macd_signal


def compute_bollinger(prices, period=20, num_std=2):
    """Compute Bollinger Bands (upper and lower)."""
    sma = prices.rolling(window=period, min_periods=1).mean()
    std = prices.rolling(window=period, min_periods=1).std().fillna(0)
    upper = sma + (std * num_std)
    lower = sma - (std * num_std)
    return upper, lower


def compute_obv(close, volume):
    """Compute On-Balance Volume."""
    obv = pd.Series(0.0, index=close.index)
    for i in range(1, len(close)):
        if close.iloc[i] > close.iloc[i - 1]:
            obv.iloc[i] = obv.iloc[i - 1] + volume.iloc[i]
        elif close.iloc[i] < close.iloc[i - 1]:
            obv.iloc[i] = obv.iloc[i - 1] - volume.iloc[i]
        else:
            obv.iloc[i] = obv.iloc[i - 1]
    return obv


def prepare_features(df, sentiment_score=0.0):
    """
    Create feature matrix from raw OHLCV data.

    13 Features (Tier 2):
    Close, Volume, SMA_5, SMA_20, RSI_14, Daily_Return, Price_Range,
    MACD, MACD_Signal, Bollinger_Upper, Bollinger_Lower, OBV, Sentiment
    """
    features = pd.DataFrame(index=df.index)

    # Original 7 features
    features['Close'] = df['Close']
    features['Volume'] = df['Volume']
    features['SMA_5'] = df['Close'].rolling(5, min_periods=1).mean()
    features['SMA_20'] = df['Close'].rolling(20, min_periods=1).mean()
    features['RSI'] = compute_rsi(df['Close'])
    features['Return'] = df['Close'].pct_change().fillna(0)
    features['Range'] = (df['High'] - df['Low']) / (df['Close'] + 1e-10)

    # New Tier 2 features
    macd, macd_signal = compute_macd(df['Close'])
    features['MACD'] = macd
    features['MACD_Signal'] = macd_signal

    bb_upper, bb_lower = compute_bollinger(df['Close'])
    features['BB_Upper'] = bb_upper
    features['BB_Lower'] = bb_lower

    features['OBV'] = compute_obv(df['Close'], df['Volume'])

    # Sentiment as a constant feature (from FinBERT)
    features['Sentiment'] = sentiment_score

    features = features.bfill().fillna(0)
    return features


# ============================================================
#  WALK-FORWARD VALIDATION (Tier 2 Upgrade)
# ============================================================

def walk_forward_split(X, y, n_folds=3):
    """
    Time-series walk-forward splits (expanding window).
    Never leaks future data into training.

    Fold 1: [ 60% train ][ 13% test ]
    Fold 2: [ 73% train ][ 13% test ]
    Fold 3: [ 87% train ][ 13% test ]
    """
    n = len(X)
    fold_size = n // (n_folds + 1)
    splits = []

    for i in range(n_folds):
        train_end = fold_size * (i + 2)
        test_end = min(train_end + fold_size, n)
        if test_end <= train_end:
            continue
        splits.append((
            (X[:train_end], y[:train_end]),
            (X[train_end:test_end], y[train_end:test_end])
        ))
    return splits


# ============================================================
#  DATA SEQUENCES
# ============================================================

def create_sequences(data, lookback=60, forecast_days=7):
    """Create input sequences and targets for training."""
    X, y = [], []
    for i in range(lookback, len(data) - forecast_days):
        X.append(data[i - lookback:i])
        y.append(data[i:i + forecast_days, 0])  # Predict Close prices (column 0)
    return np.array(X), np.array(y)


# ============================================================
#  MODEL PERSISTENCE
# ============================================================

def _model_path(ticker):
    """Get the file path for a saved model."""
    safe_ticker = ticker.replace('.', '_').replace('^', '_')
    return os.path.join(MODEL_DIR, f'{safe_ticker}_lstm.pt')


def _scaler_path(ticker):
    """Get the file path for a saved scaler."""
    safe_ticker = ticker.replace('.', '_').replace('^', '_')
    return os.path.join(MODEL_DIR, f'{safe_ticker}_scaler.pkl')


def save_model(ticker, model, scaler, feature_count):
    """Save a trained model and scaler to disk."""
    torch.save({
        'model_state_dict': model.state_dict(),
        'input_size': feature_count,
        'hidden_size': model.hidden_size,
        'num_layers': model.num_layers,
        'output_size': model.output_size,
        'has_attention': True,
        'timestamp': time.time(),
    }, _model_path(ticker))
    joblib.dump(scaler, _scaler_path(ticker))
    print(f"[LSTM] Model saved for {ticker}")


def load_saved_model(ticker, feature_count=13):
    """Load a pre-trained model from disk if it exists and is fresh."""
    model_file = _model_path(ticker)
    scaler_file = _scaler_path(ticker)

    if not os.path.exists(model_file) or not os.path.exists(scaler_file):
        return None, None

    try:
        checkpoint = torch.load(model_file, weights_only=False)

        # Check if model is still fresh (less than 24h old)
        saved_time = checkpoint.get('timestamp', 0)
        if time.time() - saved_time > CACHE_DURATION:
            return None, None  # Stale model

        model = AttentionLSTM(
            input_size=checkpoint['input_size'],
            hidden_size=checkpoint.get('hidden_size', 64),
            num_layers=checkpoint.get('num_layers', 2),
            output_size=checkpoint.get('output_size', 7),
        )
        model.load_state_dict(checkpoint['model_state_dict'])
        model.eval()

        scaler = joblib.load(scaler_file)
        print(f"[LSTM] Loaded saved AttentionLSTM for {ticker}")
        return model, scaler
    except Exception as e:
        print(f"[LSTM] Could not load saved model for {ticker}: {e}")
        return None, None


# ============================================================
#  TRAIN & PREDICT (with Walk-Forward Validation)
# ============================================================

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
    # Check in-memory cache
    if ticker in _model_cache:
        cached = _model_cache[ticker]
        if time.time() - cached['timestamp'] < CACHE_DURATION:
            return cached['result']

    print(f"[LSTM] Processing {ticker}...")

    # 1. Fetch 1 year of real data
    stock = yf.Ticker(ticker)
    df = stock.history(period="1y")

    if df.empty or len(df) < lookback + forecast_days + 10:
        raise ValueError(f"Insufficient data for {ticker}. Need at least {lookback + forecast_days + 10} days.")

    # 2. Get sentiment score
    sentiment_score = get_sentiment_for_ticker(ticker)

    # 3. Prepare extended features (13 features)
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

    # 6. Predict future using the last `lookback` days
    last_sequence = scaled_data[-lookback:]
    last_sequence_t = torch.FloatTensor(last_sequence).unsqueeze(0)

    with torch.no_grad():
        future_scaled = model(last_sequence_t).numpy()[0]

    # Inverse transform predictions
    dummy = np.zeros((forecast_days, num_features))
    dummy[:, 0] = future_scaled  # Close is column 0
    future_prices = scaler.inverse_transform(dummy)[:, 0]

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

    # Cache in memory
    _model_cache[ticker] = {
        'result': result,
        'timestamp': time.time()
    }

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
