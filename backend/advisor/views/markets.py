import time
import yfinance as yf
from django.http import JsonResponse

# ============= CACHE =============
market_cache = {}
CACHE_DURATION = 600  # 10 minutes

STOCK_NAME_MAPPING = {
    "RELIANCE": "RELIANCE.NS",
    "TCS": "TCS.NS",
    "TATA CONSULTANCY": "TCS.NS",
    "HDFC BANK": "HDFCBANK.NS",
    "INFOSYS": "INFY.NS",
    "INFY": "INFY.NS",
    "ICICI BANK": "ICICIBANK.NS",
    "HINDUSTAN UNILEVER": "HUL.NS",
    "HUL": "HUL.NS",
    "UNILEVER": "HUL.NS",
    "ITC": "ITC.NS",
    "SBI": "SBIN.NS",
    "STATE BANK": "SBIN.NS",
    "BHARTI AIRTEL": "BHARTIARTL.NS",
    "AIRTEL": "BHARTIARTL.NS",
    "KOTAK": "KOTAKBANK.NS",
    "L&T": "LT.NS",
    "LARSEN": "LT.NS",
    "AXIS": "AXISBANK.NS",
    "ASIAN PAINTS": "ASIANPAINT.NS",
    "MARUTI": "MARUTI.NS",
    "SUN PHARMA": "SUNPHARMA.NS",
    "BAJAJ FINANCE": "BAJFINANCE.NS",
    "TITAN": "TITAN.NS",
    "ULTRATECH": "ULTRACEMCO.NS",
    "BAJAJ FINSERV": "BAJAJFINSV.NS",
    "WIPRO": "WIPRO.NS"
}

# Popular NIFTY 50 tickers for top movers
TOP_MOVERS_TICKERS = [
    "RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "INFY.NS", "ICICIBANK.NS",
    "HINDUNILVR.NS", "ITC.NS", "SBIN.NS", "BHARTIARTL.NS", "KOTAKBANK.NS",
    "LT.NS", "AXISBANK.NS", "ASIANPAINT.NS", "MARUTI.NS", "SUNPHARMA.NS",
    "BAJFINANCE.NS", "TITAN.NS", "ULTRACEMCO.NS", "BAJAJFINSV.NS", "WIPRO.NS",
    "TATASTEEL.NS", "ADANIENT.NS", "ONGC.NS", "TATAMOTORS.NS", "POWERGRID.NS",
]


# ============= HELPERS =============

def get_market_data(symbol, name):
    current_time = time.time()

    # Check cache first
    if symbol in market_cache:
        cached_data = market_cache[symbol]
        if current_time - cached_data['timestamp'] < CACHE_DURATION:
            latest_price = cached_data['price']
            change = cached_data.get('change', 0.0)
            percent_change = cached_data.get('percent', 0.0)
            return {
                "name": name,
                "value": f"{latest_price:,.2f}",
                "change": f"{'+' if change >= 0 else ''}{change:,.2f}",
                "percent": f"{'+' if percent_change >= 0 else ''}{percent_change}%"
            }

    # Fetch from API
    try:
        ticker = yf.Ticker(symbol)
        data = ticker.history(period="2d")

        if data.empty or "Close" not in data.columns:
            raise ValueError("No data found")

        latest_price = round(data["Close"].iloc[-1], 2)

        # Calculate change
        if len(data) >= 2:
            prev_close = data["Close"].iloc[-2]
            change = round(latest_price - prev_close, 2)
            percent_change = round((change / prev_close) * 100, 2)
        else:
            prev_close = latest_price
            change = 0.0
            percent_change = 0.0

            try:
                info = ticker.info
                if 'previousClose' in info and info['previousClose']:
                    prev_close = info['previousClose']
                    change = round(latest_price - prev_close, 2)
                    percent_change = round((change / prev_close) * 100, 2)
            except:
                pass

        # Update cache
        market_cache[symbol] = {
            'price': latest_price,
            'change': change,
            'percent': percent_change,
            'timestamp': current_time
        }

    except Exception:
        if symbol in market_cache:
            cached = market_cache[symbol]
            latest_price = cached['price']
            change = cached.get('change', 0.0)
            percent_change = cached.get('percent', 0.0)
        else:
            latest_price = 24000.00 if "NSEI" in symbol else 79000.00 if "BSESN" in symbol else 51000.00
            change = 0.0
            percent_change = 0.0

    return {
        "name": name,
        "value": f"{latest_price:,.2f}",
        "change": f"{'+' if change >= 0 else ''}{change:,.2f}",
        "percent": f"{'+' if percent_change >= 0 else ''}{percent_change}%"
    }


# ============= VIEWS =============

def analyze_stock(request, symbol):
    try:
        ticker = yf.Ticker(f"{symbol}.NS")
        df = ticker.history(period="5d")

        if df.empty or "Close" not in df.columns:
            return JsonResponse({"error": f"No data found for {symbol}"}, status=404)

        latest_price = df["Close"].iloc[-1]
        average_price = df["Close"].mean()
        suggestion = "Buy" if latest_price < average_price else "Hold"

        return JsonResponse({
            "symbol": symbol,
            "latest_price": round(latest_price, 2),
            "average_price": round(average_price, 2),
            "suggestion": suggestion
        })
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


def get_market_status(request):
    indices = [
        {"symbol": "^NSEI", "name": "NIFTY 50"},
        {"symbol": "^BSESN", "name": "SENSEX"},
        {"symbol": "^NSEBANK", "name": "BANK NIFTY"},
        {"symbol": "^CNXIT", "name": "NIFTY IT"},
        {"symbol": "^IXIC", "name": "NASDAQ"},
        {"symbol": "^GSPC", "name": "S&P 500"},
        {"symbol": "GC=F", "name": "GOLD"},
        {"symbol": "INR=X", "name": "USD/INR"},
    ]

    results = []
    for index in indices:
        results.append(get_market_data(index["symbol"], index["name"]))

    return JsonResponse(results, safe=False)


def get_nifty(request):
    data = get_market_data("^NSEI", "NIFTY 50")
    return JsonResponse(data)


def get_sensex(request):
    data = get_market_data("^BSESN", "SENSEX")
    return JsonResponse(data)


def get_banknifty(request):
    data = get_market_data("^NSEBANK", "BANK NIFTY")
    return JsonResponse(data)


from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def search_stock(request):
    symbol = request.GET.get('symbol', '').strip().upper()
    risk_class = request.GET.get('risk', '').strip()
    if not symbol:
        return JsonResponse({"error": "Symbol parameter is required"}, status=400)

    # Check mapping first
    if symbol in STOCK_NAME_MAPPING:
        symbol = STOCK_NAME_MAPPING[symbol]

    # Fuzzy match on names
    for name, ticker in STOCK_NAME_MAPPING.items():
        if name in symbol or symbol in name:
            symbol = ticker
            break

    # Auto-append .NS if not present
    if not symbol.endswith('.NS') and not symbol.endswith('.BO') and not symbol.startswith('^'):
        symbol = f"{symbol}.NS"

    try:
        ticker = yf.Ticker(symbol)
        data = ticker.history(period="5d")

        if data.empty:
            return JsonResponse({"error": "Stock not found"}, status=404)

        latest_price = round(data["Close"].iloc[-1], 2)
        average_price = data["Close"].mean()

        info = ticker.info
        name = info.get('longName', symbol)
        previous_close = info.get('previousClose', latest_price)
        change = round(((latest_price - previous_close) / previous_close) * 100, 2)
        volume = info.get('volume', 0)

        # Default simple suggestion (fallback for non-logged-in users)
        suggestion = "Buy" if latest_price < average_price else "Hold"
        confidence = None
        reasoning = None

        # ML-powered risk-aware suggestion when risk class is provided
        if risk_class and risk_class in ('Conservative', 'Moderate', 'Aggressive'):
            try:
                from recommender.engine import get_stock_profile, SECTOR_MAP, REASONING
                try:
                    from recommender.sentiment import get_market_sentiment
                except ImportError:
                    get_market_sentiment = None

                try:
                    from advisor.tasks import get_cached_sentiment
                except ImportError:
                    get_cached_sentiment = get_market_sentiment

                profile = get_stock_profile(symbol)
                beta = profile["beta"]
                price = profile["price"] if profile["price"] > 0 else latest_price

                # Sentiment scoring (40 pts max)
                sentiment_score = 0.0
                try:
                    if get_cached_sentiment:
                        sentiment_data = get_cached_sentiment(symbol)
                        sentiment_score = sentiment_data.get("score", 0.0)
                except Exception:
                    pass
                sentiment_pts = (sentiment_score + 1) * 20  # maps -1..1 to 0..40

                # Risk fit scoring (40 pts max)
                if risk_class == "Conservative":
                    beta_pts = max(0, (1.2 - beta) * 33)
                elif risk_class == "Aggressive":
                    beta_pts = max(0, (beta - 0.5) * 28)
                else:  # Moderate
                    beta_pts = max(0, (1.0 - abs(beta - 1.0)) * 40)

                # Valuation scoring (20 pts max)
                price_position = 0.5
                if profile["week52_high"] > 0 and profile["week52_high"] != profile["week52_low"]:
                    price_position = (price - profile["week52_low"]) / (profile["week52_high"] - profile["week52_low"] + 0.01)
                valuation_pts = (1 - price_position) * 20

                total_score = sentiment_pts + beta_pts + valuation_pts
                confidence = min(99, max(30, int(total_score)))

                # Determine suggestion from score
                if total_score >= 60:
                    suggestion = "Buy"
                elif total_score >= 40:
                    suggestion = "Hold"
                else:
                    suggestion = "Avoid"

                # Build reasoning
                phrases = REASONING.get('en', {})
                if risk_class == "Conservative":
                    fit_phrase = phrases.get('conservative_low_beta', '') if beta < 0.9 else phrases.get('conservative_other', '')
                elif risk_class == "Aggressive":
                    fit_phrase = phrases.get('aggressive_high_beta', '') if beta > 1.1 else phrases.get('aggressive_other', '')
                else:
                    fit_phrase = phrases.get('moderate', '')

                if sentiment_score > 0.1:
                    news_phrase = phrases.get('news_positive', '')
                elif sentiment_score < -0.1:
                    news_phrase = phrases.get('news_cautious', '')
                else:
                    news_phrase = phrases.get('news_neutral', '')

                reasoning = f"{fit_phrase} {news_phrase}".strip()
                if price_position < 0.3:
                    reasoning += f" {phrases.get('value_low', '')}"
                elif price_position > 0.8:
                    reasoning += f" {phrases.get('value_high', '')}"

            except Exception as ml_err:
                print(f"ML scoring fallback for {symbol}: {ml_err}")
                # Keep simple suggestion on ML failure

        # Build response
        response_data = {
            "symbol": symbol,
            "name": name,
            "price": latest_price,
            "change_percent": change,
            "volume": volume,
            "suggestion": suggestion
        }
        if confidence is not None:
            response_data["confidence"] = confidence
        if reasoning:
            response_data["reasoning"] = reasoning

        # Update cache (basic data only, ML results are personalized)
        market_cache[symbol] = {
            'price': latest_price,
            'timestamp': time.time(),
            'name': name,
            'change_percent': change,
            'volume': volume,
            'suggestion': suggestion if not risk_class else "Hold"  # cache neutral suggestion
        }

        return JsonResponse(response_data)

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


def get_news(request):
    from django.views.decorators.csrf import csrf_exempt
    symbol_param = request.GET.get('symbol', '^NSEI')

    symbols = [s.strip() for s in symbol_param.split(',') if s.strip()]

    try:
        all_news = []
        seen_titles = set()

        for symbol in symbols[:5]:
            try:
                ticker = yf.Ticker(symbol)
                news = ticker.news

                if not news:
                    continue

                for item in news[:5]:
                    content = item.get('content', item)
                    title = content.get('title', '') or item.get('title', '')

                    if not title or title in seen_titles:
                        continue
                    seen_titles.add(title)

                    provider = content.get('provider', {})
                    if isinstance(provider, dict):
                        publisher = provider.get('displayName', '') or provider.get('name', 'Market News')
                    else:
                        publisher = str(provider) if provider else item.get('publisher', 'Market News')

                    canonical = content.get('canonicalUrl', {})
                    if isinstance(canonical, dict):
                        link = canonical.get('url', '')
                    else:
                        link = str(canonical) if canonical else ''

                    if not link:
                        link = item.get('link', '') or f"https://finance.yahoo.com/quote/{symbol}"

                    pub_time = content.get('pubDate', None) or item.get('providerPublishTime', None)
                    if isinstance(pub_time, str):
                        try:
                            from datetime import datetime
                            dt = datetime.fromisoformat(pub_time.replace('Z', '+00:00'))
                            pub_time = int(dt.timestamp())
                        except:
                            pub_time = None

                    all_news.append({
                        'title': title,
                        'publisher': publisher or 'Market News',
                        'link': link,
                        'time': pub_time,
                        'type': content.get('contentType', item.get('type', 'STORY')),
                        'symbol': symbol.replace('.NS', '')
                    })
            except Exception as e:
                print(f"News fetch error for {symbol}: {e}")
                continue

        all_news.sort(key=lambda x: x.get('time') or 0, reverse=True)
        return JsonResponse(all_news[:15], safe=False)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


def get_top_movers(request):
    """Return top 3 gainers and top 3 losers from popular NIFTY stocks."""
    current_time = time.time()
    cache_key = '__top_movers__'

    # Check cache (5 min TTL)
    if cache_key in market_cache:
        cached = market_cache[cache_key]
        if current_time - cached['timestamp'] < 300:
            return JsonResponse(cached['data'])

    movers = []
    for ticker_symbol in TOP_MOVERS_TICKERS:
        try:
            ticker = yf.Ticker(ticker_symbol)
            data = ticker.history(period="2d")

            if data.empty or len(data) < 2:
                continue

            latest_price = round(float(data["Close"].iloc[-1]), 2)
            prev_close = float(data["Close"].iloc[-2])
            change_pct = round(((latest_price - prev_close) / prev_close) * 100, 2)
            volume = int(data["Volume"].iloc[-1]) if "Volume" in data.columns else 0

            # Friendly name from mapping or ticker
            base = ticker_symbol.replace('.NS', '')
            name = base
            try:
                info = ticker.info
                name = info.get('shortName', info.get('longName', base))
            except:
                pass

            # Format volume
            if volume >= 1_000_000:
                vol_str = f"{volume / 1_000_000:.1f}M"
            elif volume >= 1_000:
                vol_str = f"{volume / 1_000:.1f}K"
            else:
                vol_str = str(volume)

            movers.append({
                "symbol": base,
                "name": name,
                "price": latest_price,
                "change": change_pct,
                "volume": vol_str,
            })
        except Exception as e:
            print(f"Top movers error for {ticker_symbol}: {e}")
            continue

    # Sort by change
    gainers = sorted([m for m in movers if m['change'] > 0], key=lambda x: x['change'], reverse=True)[:3]
    losers = sorted([m for m in movers if m['change'] < 0], key=lambda x: x['change'])[:3]

    result = {"gainers": gainers, "losers": losers}

    # Cache result
    market_cache[cache_key] = {
        'data': result,
        'timestamp': current_time,
    }

    return JsonResponse(result)
