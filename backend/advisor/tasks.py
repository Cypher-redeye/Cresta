"""
Celery tasks for background ML processing.
Pre-computes sentiment and LSTM predictions so API requests are instant.
"""
import json
import time
from django.core.cache import cache

try:
    from celery import shared_task
except ImportError:
    # Fallback: if celery not installed, make tasks callable as regular functions
    def shared_task(func):
        func.delay = func
        func.apply_async = lambda *a, **kw: func()
        return func


# ============= SENTIMENT PRE-COMPUTATION =============

NIFTY_TICKERS = [
    "RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "INFY.NS", "ICICIBANK.NS",
    "HINDUNILVR.NS", "BHARTIARTL.NS", "SBIN.NS", "ITC.NS", "BAJFINANCE.NS",
    "KOTAKBANK.NS", "LT.NS", "HCLTECH.NS", "AXISBANK.NS", "ASIANPAINT.NS",
    "MARUTI.NS", "SUNPHARMA.NS", "TITAN.NS", "ULTRACEMCO.NS", "WIPRO.NS",
    "TATAMOTORS.NS", "TATASTEEL.NS", "JSWSTEEL.NS", "POWERGRID.NS", "COALINDIA.NS",
    "ADANIENT.NS", "ADANIPORTS.NS", "HINDALCO.NS", "GRASIM.NS", "BAJAJFINSV.NS",
]


@shared_task
def precompute_sentiment():
    """
    Pre-compute FinBERT sentiment for all NIFTY 50 stocks.
    Results are stored in Django cache (Redis if configured, else LocMem).
    Runs daily via Celery Beat.
    """
    from recommender.sentiment import get_market_sentiment

    print(f"[CELERY] Starting sentiment pre-computation for {len(NIFTY_TICKERS)} stocks...")
    results = {}
    success = 0
    errors = 0

    for ticker in NIFTY_TICKERS:
        try:
            sentiment = get_market_sentiment(ticker)
            results[ticker] = {
                'score': sentiment['score'],
                'confidence': sentiment.get('confidence', 0),
                'headlines': sentiment['headlines'],
                'timestamp': time.time(),
            }
            # Cache each ticker individually (24h TTL)
            cache.set(f'sentiment:{ticker}', results[ticker], timeout=86400)
            success += 1
            print(f"  ✓ {ticker}: score={sentiment['score']:.3f}")
        except Exception as e:
            print(f"  ✗ {ticker}: {e}")
            errors += 1

    # Cache the full results map
    cache.set('sentiment:all', results, timeout=86400)
    cache.set('sentiment:last_run', time.time(), timeout=86400 * 7)

    print(f"[CELERY] Sentiment done: {success} ok, {errors} errors")
    return {'success': success, 'errors': errors}


def get_cached_sentiment(ticker):
    """
    Get pre-computed sentiment from cache, fallback to live computation.
    Used by engine.py instead of calling FinBERT directly.
    """
    cached = cache.get(f'sentiment:{ticker}')
    if cached and time.time() - cached.get('timestamp', 0) < 86400:
        return cached

    # Fallback: compute live
    from recommender.sentiment import get_market_sentiment
    return get_market_sentiment(ticker)


# ============= LSTM PRE-TRAINING =============

TOP_TICKERS = [
    "RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "INFY.NS", "ICICIBANK.NS",
    "SBIN.NS", "ITC.NS", "BAJFINANCE.NS", "LT.NS", "TATAMOTORS.NS",
    "HINDUNILVR.NS", "BHARTIARTL.NS", "KOTAKBANK.NS", "HCLTECH.NS",
    "AXISBANK.NS", "ASIANPAINT.NS", "MARUTI.NS", "SUNPHARMA.NS",
    "TITAN.NS", "ULTRACEMCO.NS", "WIPRO.NS", "TATASTEEL.NS",
    "JSWSTEEL.NS", "POWERGRID.NS", "COALINDIA.NS", "ADANIENT.NS",
    "ADANIPORTS.NS", "HINDALCO.NS", "GRASIM.NS", "BAJAJFINSV.NS",
]


@shared_task
def pretrain_lstm_models():
    """
    Pre-train ensemble models (AttentionLSTM + XGBoost + ARIMA) for popular stocks.
    Models are saved to disk and reused for 24h.
    Runs daily via Celery Beat.
    """
    from recommender.ensemble_predictor import ensemble_predict

    print(f"[CELERY] Starting ensemble pre-training for {len(TOP_TICKERS)} stocks...")
    success = 0
    errors = 0

    for ticker in TOP_TICKERS:
        try:
            result = ensemble_predict(ticker)
            success += 1
            models_used = result.get('metrics', {}).get('models_used', [])
            print(f"  ✓ {ticker}: {len(result['predictions'])} predictions ({', '.join(models_used)})")
        except Exception as e:
            print(f"  ✗ {ticker}: {e}")
            errors += 1

    print(f"[CELERY] Ensemble pre-training done: {success} ok, {errors} errors")
    return {'success': success, 'errors': errors}


@shared_task
def daily_ml_refresh():
    """Master task: runs both sentiment + LSTM pre-computation."""
    print("[CELERY] === Daily ML Refresh Started ===")
    sentiment_result = precompute_sentiment()
    lstm_result = pretrain_lstm_models()
    print("[CELERY] === Daily ML Refresh Complete ===")
    return {
        'sentiment': sentiment_result,
        'lstm': lstm_result,
    }
