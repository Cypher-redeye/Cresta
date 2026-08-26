# chatbot/tools.py
"""
LangChain tool definitions for CRESTA's AI chatbot.
Each tool wraps an existing Django API or ML pipeline function.
"""
import logging
from langchain_core.tools import tool

logger = logging.getLogger(__name__)


@tool
def get_portfolio(user_id: str) -> dict:
    """Get user portfolio: all stock holdings with quantities, average buy prices,
    current live prices, and profit/loss for each holding. Use this when the user
    asks about their stocks, holdings, portfolio value, or P&L."""
    try:
        from advisor.models import Holding
        from django.contrib.auth.models import User
        import yfinance as yf
        import pandas as pd

        user = User.objects.get(id=int(user_id))
        holdings = list(Holding.objects.filter(user=user))

        if not holdings:
            return {"holdings": [], "total_invested": 0, "total_current": 0, "total_pnl": 0}

        # Batch fetch live prices
        tickers = list(set([h.ticker for h in holdings]))
        prices = {}
        try:
            df = yf.download(tickers, period='1d', progress=False)['Close']
            if len(df) > 0:
                last_row = df.iloc[-1]
                for ticker in tickers:
                    val = last_row.get(ticker) if len(tickers) > 1 else last_row
                    if pd.notna(val):
                        prices[ticker] = float(val)
        except Exception as e:
            logger.warning(f"Failed to fetch live prices: {e}")

        result = []
        total_invested = 0
        total_current = 0

        for h in holdings:
            ltp = prices.get(h.ticker, h.avg_price)
            invested = h.qty * h.avg_price
            current = h.qty * ltp
            pnl = current - invested
            pnl_pct = (pnl / invested * 100) if invested > 0 else 0

            total_invested += invested
            total_current += current

            result.append({
                "ticker": h.ticker,
                "name": h.name,
                "qty": h.qty,
                "avg_price": round(h.avg_price, 2),
                "current_price": round(ltp, 2),
                "invested": round(invested, 2),
                "current_value": round(current, 2),
                "pnl": round(pnl, 2),
                "pnl_pct": round(pnl_pct, 2),
            })

        return {
            "holdings": result,
            "total_invested": round(total_invested, 2),
            "total_current": round(total_current, 2),
            "total_pnl": round(total_current - total_invested, 2),
            "total_pnl_pct": round((total_current - total_invested) / total_invested * 100, 2) if total_invested > 0 else 0,
        }
    except User.DoesNotExist:
        return {"error": "User not found"}
    except Exception as e:
        logger.error(f"get_portfolio failed: {e}")
        return {"error": str(e)}


@tool
def get_forecast(ticker: str) -> dict:
    """Run ML ensemble forecast for a stock. Returns 7-day price prediction
    with confidence metrics. Ensemble uses LSTM (70%) + XGBoost (10%) + ARIMA (20%).
    Use NSE format ticker (e.g., RELIANCE.NS). Use when user asks about
    stock outlook, prediction, or forecast."""
    try:
        # Normalize ticker
        if not ticker.endswith('.NS') and not ticker.endswith('.BO') and not ticker.startswith('^'):
            ticker = f"{ticker}.NS"
        ticker = ticker.upper()

        # Try cached prediction first
        from recommender.stock_predictor import get_cached_prediction
        cached = get_cached_prediction(ticker)
        if cached:
            return {
                "ticker": ticker,
                "predictions": cached['predictions'],
                "metrics": cached.get('metrics', {}),
                "model": "Ensemble (AttentionLSTM + XGBoost + ARIMA)",
                "source": "cached"
            }

        # Run live ensemble prediction
        from recommender.ensemble_predictor import ensemble_predict
        result = ensemble_predict(ticker, fast_mode=True)
        return {
            "ticker": ticker,
            "predictions": result['predictions'],
            "metrics": result.get('metrics', {}),
            "model_breakdown": result.get('model_breakdown', {}),
            "model": "Ensemble (AttentionLSTM + XGBoost + ARIMA)",
            "source": "live"
        }
    except Exception as e:
        logger.error(f"get_forecast failed for {ticker}: {e}")
        return {"error": f"Could not generate forecast for {ticker}: {str(e)}"}


@tool
def get_risk_profile(user_id: str) -> dict:
    """Get user's risk classification and the key factors that determined it.
    Returns risk category (Conservative/Balanced/Aggressive) and feature
    importance scores explaining why. Use when user asks about their risk
    profile or why they were classified a certain way."""
    try:
        from advisor.models import UserProfile
        from django.contrib.auth.models import User

        user = User.objects.get(id=int(user_id))
        profile = UserProfile.objects.get(user=user)

        result = {
            "risk_category": profile.risk_profile or "Not assessed",
            "risk_score": profile.risk_score,
            "age": profile.age,
            "income": profile.income,
            "investment_goal": profile.investment_goal,
        }

        # Get feature importance from XGBoost model
        try:
            from recommender.risk_profiler import RiskProfiler
            profiler = RiskProfiler()
            importance = profiler.get_feature_importance()
            if importance:
                result["feature_importance"] = importance
        except Exception as e:
            logger.warning(f"Could not get feature importance: {e}")

        return result
    except UserProfile.DoesNotExist:
        return {"error": "Risk profile not found. User has not completed risk assessment."}
    except Exception as e:
        logger.error(f"get_risk_profile failed: {e}")
        return {"error": str(e)}


@tool
def get_market_data(ticker: str) -> dict:
    """Get live market data for a stock: current price, day's change, volume,
    52-week high/low. Use NSE format ticker (e.g., RELIANCE.NS, TCS.NS).
    Also works for indices (^NSEI for Nifty 50, ^BSESN for Sensex).
    Use when user asks about a stock's current price or market data."""
    try:
        import yfinance as yf

        # Normalize ticker
        if not ticker.startswith('^') and not ticker.endswith('.NS') and not ticker.endswith('.BO'):
            ticker = f"{ticker}.NS"
        ticker = ticker.upper()

        stock = yf.Ticker(ticker)
        info = stock.info
        hist = stock.history(period='5d')

        if hist.empty:
            return {"error": f"No data found for {ticker}"}

        current_price = float(hist['Close'].iloc[-1])
        prev_close = float(hist['Close'].iloc[-2]) if len(hist) > 1 else current_price
        change = current_price - prev_close
        change_pct = (change / prev_close * 100) if prev_close > 0 else 0

        return {
            "ticker": ticker,
            "name": info.get('shortName', ticker),
            "current_price": round(current_price, 2),
            "previous_close": round(prev_close, 2),
            "change": round(change, 2),
            "change_pct": round(change_pct, 2),
            "volume": int(hist['Volume'].iloc[-1]) if 'Volume' in hist else 0,
            "day_high": round(float(hist['High'].iloc[-1]), 2),
            "day_low": round(float(hist['Low'].iloc[-1]), 2),
            "week_52_high": round(info.get('fiftyTwoWeekHigh', 0), 2),
            "week_52_low": round(info.get('fiftyTwoWeekLow', 0), 2),
        }
    except Exception as e:
        logger.error(f"get_market_data failed for {ticker}: {e}")
        return {"error": f"Could not fetch market data for {ticker}: {str(e)}"}


@tool
def create_alert(user_id: str, ticker: str, price: float, direction: str) -> dict:
    """Create a price alert for a stock. Triggers when price goes above or below
    the target. direction must be 'above' or 'below'. ticker in NSE format.
    Use when user says things like 'alert me if TCS drops below 3800' or
    'notify me when RELIANCE crosses 2500'."""
    try:
        from advisor.models import WatchlistAlert
        from django.contrib.auth.models import User

        user = User.objects.get(id=int(user_id))

        # Normalize
        if not ticker.endswith('.NS') and not ticker.endswith('.BO'):
            ticker = f"{ticker}.NS"
        ticker = ticker.upper()

        direction = direction.upper()
        if direction not in ('ABOVE', 'BELOW'):
            return {"error": "direction must be 'above' or 'below'"}

        alert = WatchlistAlert.objects.create(
            user=user,
            ticker=ticker,
            target_price=price,
            condition=direction,
            is_active=True
        )

        return {
            "status": "created",
            "alert_id": alert.id,
            "ticker": ticker,
            "target_price": float(price),
            "condition": direction,
            "message": f"Alert created: You will be notified when {ticker} goes {direction.lower()} ₹{price}"
        }
    except Exception as e:
        logger.error(f"create_alert failed: {e}")
        return {"error": str(e)}


@tool
def run_backtest(ticker: str, period: str = "1y", capital: float = 100000) -> dict:
    """Backtest a buy-and-hold strategy for a stock. Returns Sharpe ratio,
    max drawdown, CAGR, final value, and benchmark comparison.
    ticker: NSE format (e.g., RELIANCE.NS).
    period: '6mo', '1y', or '2y' (default: 1y).
    capital: initial investment in INR (default: 100000).
    Use when user asks 'what if I invested in X' or 'how would X have performed'."""
    try:
        from recommender.backtester import Backtester

        # Normalize ticker
        if not ticker.endswith('.NS') and not ticker.endswith('.BO') and not ticker.startswith('^'):
            ticker = f"{ticker}.NS"
        ticker = ticker.upper()

        if period not in ('6mo', '1y', '2y'):
            period = '1y'

        bt = Backtester(ticker, risk_profile='Moderate', initial_capital=capital, period=period)
        result = bt.run()
        return result
    except Exception as e:
        logger.error(f"run_backtest failed for {ticker}: {e}")
        return {"error": f"Could not run backtest for {ticker}: {str(e)}"}


@tool
def get_news_sentiment(ticker: str) -> dict:
    """Fetch recent news headlines for a stock and return FinBERT sentiment
    analysis. Returns overall sentiment score (-1 to 1), confidence, and
    individual headline sentiments. Use NSE format ticker.
    Use when user asks about market sentiment, news, or what people are saying."""
    try:
        # Normalize ticker
        if not ticker.endswith('.NS') and not ticker.endswith('.BO'):
            ticker = f"{ticker}.NS"
        ticker = ticker.upper()

        # Try cached sentiment first
        from advisor.tasks import get_cached_sentiment
        result = get_cached_sentiment(ticker)
        return {
            "ticker": ticker,
            "overall_score": result.get('score', 0),
            "confidence": result.get('confidence', 0),
            "headlines": result.get('headlines', []),
            "interpretation": (
                "Bullish" if result.get('score', 0) > 0.15
                else "Bearish" if result.get('score', 0) < -0.15
                else "Neutral"
            )
        }
    except Exception as e:
        logger.error(f"get_news_sentiment failed for {ticker}: {e}")
        return {"error": f"Could not fetch sentiment for {ticker}: {str(e)}"}


# All tools for the agent
CRESTA_TOOLS = [
    get_portfolio,
    get_forecast,
    get_risk_profile,
    get_market_data,
    create_alert,
    run_backtest,
    get_news_sentiment,
]
