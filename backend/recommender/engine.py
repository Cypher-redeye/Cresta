import os
import json
import joblib
import pandas as pd
import yfinance as yf

try:
    from recommender.sentiment import get_market_sentiment
except ImportError:
    from sentiment import get_market_sentiment

# Try to use cached sentiment from Celery tasks
try:
    from advisor.tasks import get_cached_sentiment
except ImportError:
    get_cached_sentiment = get_market_sentiment


# ============= STOCK UNIVERSE WITH SECTOR MAP =============

SECTOR_MAP = {
    # IT
    "TCS.NS": "IT", "INFY.NS": "IT", "WIPRO.NS": "IT", "HCLTECH.NS": "IT",
    # Banking & Finance
    "HDFCBANK.NS": "Banking", "ICICIBANK.NS": "Banking", "SBIN.NS": "Banking",
    "KOTAKBANK.NS": "Banking", "AXISBANK.NS": "Banking", "BAJFINANCE.NS": "Finance",
    "BAJAJFINSV.NS": "Finance", "INDUSINDBK.NS": "Banking",
    # Energy & Oil
    "RELIANCE.NS": "Energy", "ONGC.NS": "Energy", "BPCL.NS": "Energy",
    # FMCG
    "HUL.NS": "FMCG", "ITC.NS": "FMCG", "NESTLEIND.NS": "FMCG", "BRITANNIA.NS": "FMCG",
    # Auto
    "MARUTI.NS": "Auto", "BAJAJ-AUTO.NS": "Auto", "EICHERMOT.NS": "Auto",
    "HEROMOTOCO.NS": "Auto", "M&M.NS": "Auto",
    # Pharma
    "SUNPHARMA.NS": "Pharma", "CIPLA.NS": "Pharma", "DRREDDY.NS": "Pharma",
    "DIVISLAB.NS": "Pharma", "APOLLOHOSP.NS": "Healthcare",
    # Metals & Infrastructure
    "JSWSTEEL.NS": "Metals", "HINDALCO.NS": "Metals", "COALINDIA.NS": "Mining",
    "LT.NS": "Infrastructure", "ULTRACEMCO.NS": "Infrastructure", "GRASIM.NS": "Infrastructure",
    # Telecom & Consumer
    "BHARTIARTL.NS": "Telecom", "TITAN.NS": "Consumer", "ASIANPAINT.NS": "Consumer",
    # Conglomerates
    "ADANIENT.NS": "Conglomerate", "ADANIPORTS.NS": "Infrastructure",
}

STOCK_UNIVERSE = list(SECTOR_MAP.keys())
MAX_PER_SECTOR = 2  # Cap: max 2 stocks from same sector in recommendations


# ============= TRANSLATED REASONING =============

REASONING = {
    'en': {
        'conservative_low_beta': "This is a low-risk, steady stock — perfect for your safety-first approach.",
        'conservative_other': "A stable choice that balances safety with modest growth potential.",
        'aggressive_high_beta': "Strong growth potential — ideal for your high-growth strategy.",
        'aggressive_other': "A solid performer with room for upside, complementing your wealth-building approach.",
        'moderate': "A well-balanced stock offering steady growth without excessive risk.",
        'news_positive': "Recent news is positive, showing strong market confidence.",
        'news_cautious': "Some recent news is cautious, but the fundamentals remain solid.",
        'news_neutral': "Market news is currently stable with no major concerns.",
        'value_low': "Currently trading near its yearly low — could be a good entry point.",
        'value_high': "Trading near its yearly high, showing strong momentum.",
    },
    'hi': {
        'conservative_low_beta': "यह कम जोखिम वाला, स्थिर स्टॉक है — सुरक्षा-प्रथम दृष्टिकोण के लिए उत्तम।",
        'conservative_other': "एक स्थिर विकल्प जो सुरक्षा और मध्यम वृद्धि का संतुलन करता है।",
        'aggressive_high_beta': "मजबूत वृद्धि क्षमता — आपकी उच्च-वृद्धि रणनीति के लिए आदर्श।",
        'aggressive_other': "ऊपर की ओर जाने की गुंजाइश के साथ एक ठोस प्रदर्शनकर्ता।",
        'moderate': "अत्यधिक जोखिम के बिना स्थिर वृद्धि प्रदान करने वाला संतुलित स्टॉक।",
        'news_positive': "हालिया समाचार सकारात्मक हैं, बाजार में मजबूत विश्वास दिखा रहे हैं।",
        'news_cautious': "कुछ समाचार सतर्क हैं, लेकिन बुनियादी बातें मजबूत हैं।",
        'news_neutral': "बाजार समाचार वर्तमान में स्थिर हैं।",
        'value_low': "अपने वार्षिक निचले स्तर के पास कारोबार कर रहा है — अच्छा प्रवेश बिंदु हो सकता है।",
        'value_high': "वार्षिक उच्च स्तर के पास, मजबूत गति दिखा रहा है।",
    },
    'gu': {
        'conservative_low_beta': "આ ઓછા જોખમવાળો, સ્થિર સ્ટોક છે — સુરક્ષા-પ્રથમ અભિગમ માટે ઉત્તમ.",
        'conservative_other': "એક સ્થિર પસંદગી જે સુરક્ષા અને મધ્યમ વૃદ્ધિનું સંતુલન કરે છે.",
        'aggressive_high_beta': "મજબૂત વૃદ્ધિ ક્ષમતા — તમારી ઉચ્ચ-વૃદ્ધિ વ્યૂહરચના માટે આદર્શ.",
        'aggressive_other': "ઉપરની તરફ જવાની ગુંજાઈશ સાથે એક ઠોસ કામગીરી.",
        'moderate': "વધુ પડતા જોખમ વિના સ્થિર વૃદ્ધિ આપતો સંતુલિત સ્ટોક.",
        'news_positive': "તાજેતરના સમાચાર સકારાત્મક છે.",
        'news_cautious': "કેટલાક સમાચાર સાવચેત છે, પરંતુ મૂળભૂત બાબતો મજબૂત છે.",
        'news_neutral': "બજારના સમાચાર હાલમાં સ્થિર છે.",
        'value_low': "તેના વાર્ષિક નીચલા સ્તર પાસે — સારો પ્રવેશ બિંદુ હોઈ શકે.",
        'value_high': "વાર્ષિક ઉચ્ચ સ્તર પાસે, મજબૂત ગતિ દર્શાવે છે.",
    },
    'pa': {
        'conservative_low_beta': "ਇਹ ਘੱਟ ਜੋਖਮ ਵਾਲਾ, ਸਥਿਰ ਸਟਾਕ ਹੈ — ਸੁਰੱਖਿਆ-ਪਹਿਲਾਂ ਪਹੁੰਚ ਲਈ ਸੰਪੂਰਨ.",
        'conservative_other': "ਇੱਕ ਸਥਿਰ ਚੋਣ ਜੋ ਸੁਰੱਖਿਆ ਅਤੇ ਮੱਧਮ ਵਿਕਾਸ ਦਾ ਸੰਤੁਲਨ ਕਰਦੀ ਹੈ.",
        'aggressive_high_beta': "ਮਜ਼ਬੂਤ ​​ਵਿਕਾਸ ਸੰਭਾਵਨਾ — ਤੁਹਾਡੀ ਉੱਚ-ਵਿਕਾਸ ਰਣਨੀਤੀ ਲਈ ਆਦਰਸ਼.",
        'aggressive_other': "ਉੱਪਰ ਵੱਲ ਜਾਣ ਦੀ ਗੁੰਜਾਇਸ਼ ਵਾਲਾ ਇੱਕ ਠੋਸ ਪ੍ਰਦਰਸ਼ਨਕਾਰ.",
        'moderate': "ਬਹੁਤ ਜ਼ਿਆਦਾ ਜੋਖਮ ਤੋਂ ਬਿਨਾਂ ਸਥਿਰ ਵਿਕਾਸ ਪੇਸ਼ ਕਰਨ ਵਾਲਾ ਸੰਤੁਲਿਤ ਸਟਾਕ.",
        'news_positive': "ਤਾਜ਼ਾ ਖ਼ਬਰਾਂ ਸਕਾਰਾਤਮਕ ਹਨ.",
        'news_cautious': "ਕੁਝ ਖ਼ਬਰਾਂ ਸਾਵਧਾਨ ਹਨ, ਪਰ ਬੁਨਿਆਦ ਮਜ਼ਬੂਤ ​​ਹੈ.",
        'news_neutral': "ਮਾਰਕੀਟ ਖ਼ਬਰਾਂ ਹਾਲ ਹੀ ਵਿੱਚ ਸਥਿਰ ਹਨ.",
        'value_low': "ਆਪਣੇ ਸਾਲਾਨਾ ਹੇਠਲੇ ਪੱਧਰ ਦੇ ਨੇੜੇ — ਚੰਗਾ ਦਾਖ਼ਲਾ ਬਿੰਦੂ ਹੋ ਸਕਦਾ ਹੈ.",
        'value_high': "ਸਾਲਾਨਾ ਉੱਚ ਪੱਧਰ ਦੇ ਨੇੜੇ, ਮਜ਼ਬੂਤ ​​ਗਤੀ ਦਿਖਾ ਰਿਹਾ ਹੈ.",
    },
}


def load_model():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(current_dir, "user_classifier.pkl")
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model not found at {model_path}. Please run train.py first.")
    return joblib.load(model_path)


def get_stock_profile(ticker: str):
    """Fetches key stock metrics via yfinance."""
    try:
        stock = yf.Ticker(ticker)
        info = stock.info
        beta = info.get("beta", 1.0)
        price = info.get("currentPrice", info.get("regularMarketPrice", 0.0))
        name = info.get("longName", ticker.replace(".NS", ""))
        sector = SECTOR_MAP.get(ticker, info.get("sector", "Other"))
        pe_ratio = info.get("trailingPE", 0)
        market_cap = info.get("marketCap", 0)
        week52_high = info.get("fiftyTwoWeekHigh", price)
        week52_low = info.get("fiftyTwoWeekLow", price)
        return {
            "beta": beta if beta else 1.0,
            "price": price,
            "name": name,
            "sector": sector,
            "pe_ratio": round(pe_ratio, 2) if pe_ratio else 0,
            "market_cap": market_cap,
            "week52_high": week52_high,
            "week52_low": week52_low
        }
    except Exception:
        return {
            "beta": 1.0, "price": 0.0, "name": ticker.replace(".NS", ""),
            "sector": SECTOR_MAP.get(ticker, "Other"), "pe_ratio": 0,
            "market_cap": 0, "week52_high": 0, "week52_low": 0
        }


def recommend_stocks(user_profile: dict, max_recommendations: int = 5, lang: str = 'en') -> str:
    """
    Main recommendation function.
    Returns JSON with scored, ranked stocks including:
    - XAI score breakdown (sentiment, risk_fit, valuation)
    - Translated reasoning
    - Sectoral diversity (max 2 per sector)
    - News headlines with confidence
    """
    phrases = REASONING.get(lang, REASONING['en'])

    # 1. Predict User Class
    export_data = load_model()
    model = export_data['model']
    encoder = export_data['goal_encoder']

    encoded_goal = encoder.transform([user_profile['Investment_Goal']])[0]

    feature_dict = {
        'Age': user_profile['Age'],
        'Income': user_profile['Income'],
        'Risk_Tolerance': user_profile['Risk_Tolerance'],
        'Investment_Goal_Encoded': encoded_goal
    }

    feature_columns = export_data.get('feature_columns', list(feature_dict.keys()))
    if 'Experience_Years' in feature_columns:
        feature_dict['Experience_Years'] = max(0, user_profile.get('Age', 25) - 21)

    df_features = pd.DataFrame([feature_dict])[feature_columns]
    user_class_num = model.predict(df_features)[0]
    
    if 'label_encoder' in export_data:
        user_class = export_data['label_encoder'].inverse_transform([user_class_num])[0]
    else:
        user_class = user_class_num
        
    print(f"Determined User Class: {user_class}")

    # 2. Score every stock in the universe
    scored_stocks = []

    for ticker in STOCK_UNIVERSE:
        try:
            # Use cached sentiment (from Celery) or compute live
            sentiment_data = get_cached_sentiment(ticker)
            sentiment_score = sentiment_data["score"]
            sentiment_confidence = sentiment_data.get("confidence", 0.5)
            headlines = sentiment_data["headlines"]

            profile = get_stock_profile(ticker)
            beta = profile["beta"]
            price = profile["price"]
            sector = profile["sector"]

            if price <= 0:
                continue

            # --- Scoring Algorithm (100 points max) ---

            # Sentiment: up to 40 points (confidence-weighted)
            sentiment_pts = (sentiment_score + 1) * 20  # maps -1..1 to 0..40

            # Risk alignment: up to 40 points
            if user_class == "Conservative":
                beta_pts = max(0, (1.2 - beta) * 33)
            elif user_class == "Aggressive":
                beta_pts = max(0, (beta - 0.5) * 28)
            else:  # Moderate
                beta_pts = max(0, (1.0 - abs(beta - 1.0)) * 40)

            # Valuation: up to 20 points
            valuation_pts = 10  # neutral default
            price_position = 0.5
            if profile["week52_high"] > 0:
                price_position = (price - profile["week52_low"]) / (profile["week52_high"] - profile["week52_low"] + 0.01)
                valuation_pts = (1 - price_position) * 20

            total_score = sentiment_pts + beta_pts + valuation_pts

            # --- Build translated reasoning ---
            if user_class == "Conservative":
                fit_phrase = phrases['conservative_low_beta'] if beta < 0.9 else phrases['conservative_other']
            elif user_class == "Aggressive":
                fit_phrase = phrases['aggressive_high_beta'] if beta > 1.1 else phrases['aggressive_other']
            else:
                fit_phrase = phrases['moderate']

            if sentiment_score > 0.1:
                news_phrase = phrases['news_positive']
            elif sentiment_score < -0.1:
                news_phrase = phrases['news_cautious']
            else:
                news_phrase = phrases['news_neutral']

            reasoning = f"{fit_phrase} {news_phrase}"
            if price_position < 0.3:
                reasoning += f" {phrases['value_low']}"
            elif price_position > 0.8:
                reasoning += f" {phrases['value_high']}"

            scored_stocks.append({
                "Ticker": ticker,
                "Name": profile["name"],
                "Price": round(price, 2),
                "Sector": sector,
                "Confidence": min(99, max(45, int(total_score))),
                "Reasoning": reasoning,
                "Headlines": headlines,
                "Score": total_score,
                # XAI: score breakdown for explainability
                "xai": {
                    "sentiment_score": round(sentiment_score, 3),
                    "sentiment_confidence": round(sentiment_confidence, 3),
                    "sentiment_pts": round(sentiment_pts, 1),
                    "risk_fit_pts": round(beta_pts, 1),
                    "valuation_pts": round(valuation_pts, 1),
                    "beta": round(beta, 2),
                    "price_position_52w": round(price_position, 2),
                }
            })

        except Exception as e:
            print(f"Skipping {ticker}: {e}")
            continue

    # 3. Sort by score, enforce sector diversity (max 2 per sector)
    scored_stocks.sort(key=lambda x: x['Score'], reverse=True)

    final_picks = []
    sector_count = {}

    for stock in scored_stocks:
        if len(final_picks) >= max_recommendations:
            break
        sector = stock['Sector']
        if sector_count.get(sector, 0) >= MAX_PER_SECTOR:
            continue  # Skip: already 2 from this sector
        sector_count[sector] = sector_count.get(sector, 0) + 1
        pick = {k: v for k, v in stock.items() if k != 'Score'}
        final_picks.append(pick)

    return json.dumps({
        "User_Profile": user_profile,
        "Assigned_Class": user_class,
        "Recommended_Stocks": final_picks
    }, indent=4)


if __name__ == "__main__":
    print("--- Running Recommendation Engine Test ---")
    test_profile = {
        'Age': 26,
        'Income': 2500000,
        'Risk_Tolerance': 5,
        'Investment_Goal': 'Wealth'
    }
    print(recommend_stocks(test_profile))
