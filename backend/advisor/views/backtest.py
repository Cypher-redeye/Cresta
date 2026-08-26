"""
Django API view for the Backtesting Engine.

Endpoints:
  GET /api/backtest/           — single-ticker backtest (cached)
  GET /api/backtest/portfolio/  — multi-ticker portfolio backtest (cached)

11.1 FIX: Added Redis caching for backtest results (1h TTL).
11.3 FIX: Identical requests return cached results instead of re-computing.
"""
import re
import hashlib
from django.core.cache import cache
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status


def _validate_ticker(ticker):
    """Validate and normalize ticker symbol."""
    ticker = ticker.strip().upper()
    if not re.match(r'^[A-Z0-9&]{1,20}(\.(NS|BO))?$', ticker) and not ticker.startswith('^'):
        return None
    if not ticker.endswith(".NS") and not ticker.endswith(".BO") and not ticker.startswith("^"):
        ticker = f"{ticker}.NS"
    return ticker


@api_view(["GET"])
@permission_classes([AllowAny])
def run_backtest(request):
    """
    Single-Ticker Backtest with caching.

    Query params:
        ticker   (str)   — e.g. "RELIANCE.NS" or "RELIANCE" (auto-appends .NS)
        risk     (str)   — "Conservative" | "Moderate" | "Aggressive"  (default: Moderate)
        capital  (float) — initial capital in ₹  (default: 100000)
        period   (str)   — "6mo" | "1y" | "2y"  (default: 1y)
    """
    ticker = _validate_ticker(request.query_params.get("ticker", ""))
    if not ticker:
        return Response(
            {"error": "Valid ticker parameter required (e.g. ?ticker=RELIANCE.NS)"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    risk = request.query_params.get("risk", "Moderate").strip()
    if risk not in ("Conservative", "Moderate", "Aggressive"):
        risk = "Moderate"

    try:
        capital = float(request.query_params.get("capital", 100000))
        if capital <= 0:
            capital = 100_000.0
    except (ValueError, TypeError):
        capital = 100_000.0

    period = request.query_params.get("period", "1y").strip()
    if period not in ("6mo", "1y", "2y"):
        period = "1y"

    # 11.3 FIX: Check cache first
    cache_key = f"backtest:{ticker}:{risk}:{period}:{int(capital)}"
    cached = cache.get(cache_key)
    if cached:
        cached['_cached'] = True
        return Response(cached)

    try:
        from recommender.backtester import Backtester

        bt = Backtester(ticker, risk_profile=risk, initial_capital=capital, period=period)
        result = bt.run()

        # Cache for 1 hour
        cache.set(cache_key, result, timeout=3600)
        return Response(result)
    except ValueError as e:
        return Response({"error": str(e)}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def run_portfolio_backtest(request):
    """
    Multi-Ticker Portfolio Backtest with caching.

    Query params:
        tickers  (str)   — comma-separated, e.g. "RELIANCE.NS,TCS.NS,INFY.NS"
        risk     (str)   — risk profile  (default: Moderate)
        capital  (float) — total initial capital  (default: 100000)
        period   (str)   — data period   (default: 1y)
    """
    tickers_raw = request.query_params.get("tickers", "").strip()
    if not tickers_raw:
        return Response(
            {"error": "tickers parameter required (e.g. ?tickers=RELIANCE.NS,TCS.NS)"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    tickers = []
    for t in tickers_raw.split(","):
        validated = _validate_ticker(t)
        if validated:
            tickers.append(validated)

    if not tickers:
        return Response({"error": "No valid tickers provided"}, status=status.HTTP_400_BAD_REQUEST)

    risk = request.query_params.get("risk", "Moderate").strip()
    if risk not in ("Conservative", "Moderate", "Aggressive"):
        risk = "Moderate"

    try:
        capital = float(request.query_params.get("capital", 100000))
        if capital <= 0:
            capital = 100_000.0
    except (ValueError, TypeError):
        capital = 100_000.0

    period = request.query_params.get("period", "1y").strip()
    if period not in ("6mo", "1y", "2y"):
        period = "1y"

    # 11.3 FIX: Check cache
    tickers_hash = hashlib.md5(",".join(sorted(tickers)).encode()).hexdigest()[:8]
    cache_key = f"backtest_port:{tickers_hash}:{risk}:{period}:{int(capital)}"
    cached = cache.get(cache_key)
    if cached:
        cached['_cached'] = True
        return Response(cached)

    try:
        from recommender.backtester import backtest_portfolio

        result = backtest_portfolio(tickers, risk_profile=risk, initial_capital=capital, period=period)
        cache.set(cache_key, result, timeout=3600)
        return Response(result)
    except ValueError as e:
        return Response({"error": str(e)}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
