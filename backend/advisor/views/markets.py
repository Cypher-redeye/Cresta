import time
import yfinance as yf
from django.http import JsonResponse

# ============= CACHE =============
market_cache = {}
CACHE_DURATION = 120  # 2 minutes — keeps prices close to real-time

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
    "LT": "LT.NS",
    "LARSEN": "LT.NS",
    "LARSEN & TOUBRO": "LT.NS",
    "AXIS": "AXISBANK.NS",
    "ASIAN PAINTS": "ASIANPAINT.NS",
    "MARUTI": "MARUTI.NS",
    "SUN PHARMA": "SUNPHARMA.NS",
    "BAJAJ FINANCE": "BAJFINANCE.NS",
    "TITAN": "TITAN.NS",
    "ULTRATECH": "ULTRACEMCO.NS",
    "BAJAJ FINSERV": "BAJAJFINSV.NS",
    "WIPRO": "WIPRO.NS",
    "ETERNAL": "ETERNAL.NS",
    "ZOMATO": "ETERNAL.NS",
    "TATA MOTORS": "TATAMOTORS.NS",
    "TATAMOTORS": "TATAMOTORS.NS",
    "TATA STEEL": "TATASTEEL.NS",
    "TATASTEEL": "TATASTEEL.NS",
    "ONGC": "ONGC.NS",
    "POWERGRID": "POWERGRID.NS",
    "POWER GRID": "POWERGRID.NS",
    "ADANI": "ADANIENT.NS",
    "ADANI ENTERPRISES": "ADANIENT.NS",
    "HDFCBANK": "HDFCBANK.NS",
    "ICICIBANK": "ICICIBANK.NS",
    "KOTAKBANK": "KOTAKBANK.NS",
    "AXISBANK": "AXISBANK.NS",
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

    # Fetch from API — prefer ticker.info for live/last-traded price
    try:
        import math
        ticker = yf.Ticker(symbol)
        info = ticker.info

        # Primary: live price from info (real-time during market hours)
        latest_price = info.get('regularMarketPrice') or info.get('currentPrice')
        prev_close = info.get('previousClose') or info.get('regularMarketPreviousClose')

        # Fallback: use history() if info didn't return a price
        if not latest_price or (isinstance(latest_price, float) and math.isnan(latest_price)):
            data = ticker.history(period="5d")
            if not data.empty and "Close" in data.columns:
                data = data.dropna(subset=["Close"])
                if not data.empty:
                    latest_price = data["Close"].iloc[-1]
                    if not prev_close and len(data) >= 2:
                        prev_close = data["Close"].iloc[-2]

        if not latest_price or (isinstance(latest_price, float) and math.isnan(latest_price)):
            raise ValueError("No price available")

        latest_price = round(float(latest_price), 2)

        # Calculate change against previous close
        if prev_close and not (isinstance(prev_close, float) and math.isnan(prev_close)) and prev_close > 0:
            change = round(latest_price - float(prev_close), 2)
            percent_change = round((change / float(prev_close)) * 100, 2)
        else:
            change = 0.0
            percent_change = 0.0

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

    # Format safely
    try:
        import math
        if math.isnan(float(latest_price)):
            latest_price = 24000.00 if "NSEI" in symbol else 79000.00 if "BSESN" in symbol else 51000.00
        if math.isnan(float(change)):
            change = 0.0
        if math.isnan(float(percent_change)):
            percent_change = 0.0

        return {
            "name": name,
            "value": f"{float(latest_price):,.2f}",
            "change": f"{'+' if float(change) >= 0 else ''}{float(change):,.2f}",
            "percent": f"{'+' if float(percent_change) >= 0 else ''}{float(percent_change):.2f}%"
        }
    except Exception:
        # Ultimate fallback
        latest_price = 24000.00 if "NSEI" in symbol else 79000.00 if "BSESN" in symbol else 51000.00
        return {
            "name": name,
            "value": f"{latest_price:,.2f}",
            "change": "+0.00",
            "percent": "+0.00%"
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
from rest_framework.permissions import AllowAny, IsAuthenticated

@api_view(['GET'])
@permission_classes([AllowAny])
def search_stock(request):
    ticker_param = request.GET.get('ticker', '').upper().strip()
    risk_class = request.GET.get('risk', '').strip()
    
    if not ticker_param:
        return JsonResponse({"error": "Ticker parameter is required"}, status=400)

    # Try .NS first, then .BO as fallback if no decimal point
    suffixes = [''] if ('.' in ticker_param or ticker_param.startswith('^')) else ['.NS', '.BO']
    tickers_to_try = [ticker_param] if ('.' in ticker_param or ticker_param.startswith('^')) else [ticker_param + s for s in suffixes]

    # Check mapping first for friendly names as a primary source
    if ticker_param in STOCK_NAME_MAPPING:
        # Move mapped ticker to the front of the list
        mapped = STOCK_NAME_MAPPING[ticker_param]
        if mapped not in tickers_to_try:
            tickers_to_try.insert(0, mapped)
        else:
            tickers_to_try.remove(mapped)
            tickers_to_try.insert(0, mapped)

    last_error = "Stock not found"
    
    for symbol in tickers_to_try:
        try:
            import math
            ticker = yf.Ticker(symbol)
            info = ticker.info

            # Primary: live price from info (matches Google)
            latest_price = info.get('regularMarketPrice') or info.get('currentPrice')
            previous_close = info.get('previousClose', 0)

            # Fallback: use history() if info didn't return a price
            if not latest_price or (isinstance(latest_price, float) and math.isnan(latest_price)):
                data = ticker.history(period="5d")
                if data.empty or "Close" not in data.columns:
                    continue
                data = data.dropna(subset=["Close"])
                if data.empty:
                    continue
                latest_price = data["Close"].iloc[-1]
                if not previous_close and len(data) >= 2:
                    previous_close = data["Close"].iloc[-2]

            if not latest_price or (isinstance(latest_price, float) and math.isnan(latest_price)):
                continue

            latest_price = round(float(latest_price), 2)

            name = info.get('longName', symbol)
            if previous_close and not (isinstance(previous_close, float) and math.isnan(previous_close)) and previous_close > 0:
                change = round(((latest_price - float(previous_close)) / float(previous_close)) * 100, 2)
            else:
                change = 0.0
            volume = info.get('volume', 0)

            # Use history average for suggestion only
            try:
                hist = ticker.history(period="5d")
                average_price = hist["Close"].mean() if not hist.empty else latest_price
            except Exception:
                average_price = latest_price

            # Default simple suggestion
            suggestion = "Buy" if latest_price < average_price else "Hold"
            confidence = None
            reasoning = None

            # --- Always generate basic reasoning (even without risk profile) ---
            try:
                week52_high = info.get('fiftyTwoWeekHigh', 0)
                week52_low = info.get('fiftyTwoWeekLow', 0)
                price_position = 0.5
                if week52_high > 0 and week52_high != week52_low:
                    price_position = (latest_price - week52_low) / (week52_high - week52_low + 0.01)

                # Basic confidence from price vs average + 52-week position
                trend_pts = 30 if latest_price < average_price else 15
                valuation_pts = (1 - price_position) * 30
                base_score = trend_pts + valuation_pts + 20  # 20 base points
                confidence = min(85, max(25, int(base_score)))

                # Basic reasoning parts
                if latest_price < average_price:
                    reason_parts = ["Currently trading below its 5-day average, indicating a potential entry point."]
                else:
                    reason_parts = ["Trading above its recent average, showing positive momentum."]

                if price_position < 0.3:
                    reason_parts.append("Near its 52-week low — could be a value opportunity.")
                elif price_position > 0.8:
                    reason_parts.append("Near its 52-week high, reflecting strong upward momentum.")
                else:
                    reason_parts.append("Price is in a healthy mid-range of its yearly trading band.")

                reasoning = " ".join(reason_parts)
            except Exception:
                pass

            # --- ML-powered risk-aware suggestion (overrides basic if available) ---
            if risk_class and risk_class in ('Conservative', 'Moderate', 'Aggressive'):
                try:
                    from recommender.engine import get_stock_profile, REASONING
                    try:
                        from advisor.tasks import get_cached_sentiment
                    except ImportError:
                        get_cached_sentiment = None

                    profile = get_stock_profile(symbol)
                    beta = profile["beta"]
                    price = profile["price"] if profile["price"] > 0 else latest_price

                    # Sentiment scoring
                    sentiment_score = 0.0
                    if get_cached_sentiment:
                        try:
                             sentiment_data = get_cached_sentiment(symbol)
                             sentiment_score = sentiment_data.get("score", 0.0)
                        except: pass
                    
                    sentiment_pts = (sentiment_score + 1) * 20

                    # Risk fit scoring
                    if risk_class == "Conservative":
                        beta_pts = max(0, (1.2 - beta) * 33)
                    elif risk_class == "Aggressive":
                        beta_pts = max(0, (beta - 0.5) * 28)
                    else:
                        beta_pts = max(0, (1.0 - abs(beta - 1.0)) * 40)

                    # Valuation scoring
                    ml_price_position = 0.5
                    if profile["week52_high"] > 0 and profile["week52_high"] != profile["week52_low"]:
                        ml_price_position = (price - profile["week52_low"]) / (profile["week52_high"] - profile["week52_low"] + 0.01)
                    ml_valuation_pts = (1 - ml_price_position) * 20

                    total_score = sentiment_pts + beta_pts + ml_valuation_pts
                    confidence = min(99, max(30, int(total_score)))

                    if total_score >= 60: suggestion = "Buy"
                    elif total_score >= 40: suggestion = "Hold"
                    else: suggestion = "Avoid"

                    phrases = REASONING.get('en', {})
                    if risk_class == "Conservative":
                        fit_phrase = phrases.get('conservative_low_beta', '') if beta < 0.9 else phrases.get('conservative_other', '')
                    elif risk_class == "Aggressive":
                        fit_phrase = phrases.get('aggressive_high_beta', '') if beta > 1.1 else phrases.get('aggressive_other', '')
                    else:
                        fit_phrase = phrases.get('moderate', '')

                    if sentiment_score > 0.1: news_phrase = phrases.get('news_positive', '')
                    elif sentiment_score < -0.1: news_phrase = phrases.get('news_cautious', '')
                    else: news_phrase = phrases.get('news_neutral', '')

                    reasoning = f"{fit_phrase} {news_phrase}".strip()
                    if ml_price_position < 0.3: reasoning += f" {phrases.get('value_low', '')}"
                    elif ml_price_position > 0.8: reasoning += f" {phrases.get('value_high', '')}"

                except Exception as ml_err:
                    print(f"ML scoring fallback for {symbol}: {ml_err}")

            return JsonResponse({
                "symbol": symbol,
                "name": name,
                "price": latest_price,
                "previous_close": round(float(previous_close), 2) if previous_close else None,
                "change_percent": change,
                "volume": volume,
                "suggestion": suggestion,
                "confidence": confidence,
                "reasoning": reasoning
            })

        except Exception as e:
            last_error = str(e)
            continue

    return JsonResponse({"error": last_error}, status=404)


def get_news(request):
    symbol_param = request.GET.get('symbol', '^NSEI')
    symbols = [s.strip() for s in symbol_param.split(',') if s.strip()]

    try:
        all_news = []
        seen_titles = set()

        # Attempt 1: yfinance news (may return empty in newer versions)
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

        # Attempt 2: If yfinance returned nothing, use Google News RSS
        if not all_news:
            try:
                all_news = _fetch_google_news_rss(symbols)
            except Exception as e:
                print(f"Google News RSS fallback error: {e}")

        all_news.sort(key=lambda x: x.get('time') or 0, reverse=True)
        return JsonResponse(all_news[:15], safe=False)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


def _fetch_google_news_rss(symbols, max_items=15):
    """Fetch market news from Google News RSS as a fallback source."""
    import requests as http_requests
    from bs4 import BeautifulSoup
    from datetime import datetime
    import warnings
    from bs4 import XMLParsedAsHTMLWarning
    warnings.filterwarnings("ignore", category=XMLParsedAsHTMLWarning)

    # Build search queries from symbols
    queries = []
    for sym in symbols[:3]:
        clean = sym.replace('.NS', '').replace('.BO', '').replace('^', '')
        queries.append(f"{clean} stock India")
    if not queries:
        queries = ["Indian stock market"]

    all_news = []
    seen_titles = set()

    for query in queries:
        try:
            url = f"https://news.google.com/rss/search?q={query.replace(' ', '+')}&hl=en-IN&gl=IN&ceid=IN:en"
            resp = http_requests.get(url, timeout=10, headers={
                'User-Agent': 'Mozilla/5.0 (compatible; Cresta/1.0)'
            })
            if resp.status_code != 200:
                continue

            soup = BeautifulSoup(resp.content, 'html.parser')
            items = soup.find_all('item')[:7]

            for item in items:
                title = item.title.text.strip() if item.title else ''
                if not title or title in seen_titles:
                    continue
                seen_titles.add(title)

                # Google News RSS puts the link as text after the <link> tag
                link = ''
                link_tag = item.find('link')
                if link_tag and link_tag.next_sibling:
                    link = str(link_tag.next_sibling).strip()
                if not link:
                    link = f"https://news.google.com/search?q={query.replace(' ', '+')}"

                publisher = item.source.text.strip() if item.source else 'Market News'

                pub_time = None
                if item.pubdate:
                    try:
                        dt = datetime.strptime(item.pubdate.text.strip(), '%a, %d %b %Y %H:%M:%S %Z')
                        pub_time = int(dt.timestamp())
                    except:
                        pub_time = None

                symbol_tag = query.split()[0].upper()
                all_news.append({
                    'title': title,
                    'publisher': publisher,
                    'link': link,
                    'time': pub_time,
                    'type': 'STORY',
                    'symbol': symbol_tag,
                })

                if len(all_news) >= max_items:
                    break
        except Exception as e:
            print(f"Google News RSS error for '{query}': {e}")
            continue

    return all_news


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
            import math
            ticker = yf.Ticker(ticker_symbol)
            info = ticker.info
            base = ticker_symbol.replace('.NS', '')

            # Primary: live price from info
            latest_price = info.get('regularMarketPrice') or info.get('currentPrice')
            prev_close = info.get('previousClose')

            # Fallback to history()
            if not latest_price or (isinstance(latest_price, float) and math.isnan(latest_price)):
                data = ticker.history(period="5d")
                if data.empty or "Close" not in data.columns:
                    continue
                data = data.dropna(subset=["Close"])
                if len(data) < 2:
                    continue
                latest_price = data["Close"].iloc[-1]
                if not prev_close:
                    prev_close = data["Close"].iloc[-2]

            if not latest_price or (isinstance(latest_price, float) and math.isnan(latest_price)):
                continue

            latest_price = round(float(latest_price), 2)

            if prev_close and not (isinstance(prev_close, float) and math.isnan(prev_close)) and prev_close > 0:
                change_pct = round(((latest_price - float(prev_close)) / float(prev_close)) * 100, 2)
            else:
                continue  # Can't compute change without previous close

            volume = info.get('volume', 0) or 0
            name = info.get('shortName', info.get('longName', base))

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
