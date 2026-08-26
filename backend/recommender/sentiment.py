import yfinance as yf

# Global cache for the pipeline
_finbert_pipeline = None


def load_finbert():
    """Load FinBERT model safely. Falls back cleanly if unavailable."""
    global _finbert_pipeline
    if _finbert_pipeline is None:
        try:
            print("[ML] Attempting to load FinBERT model...")
            from transformers import pipeline
            _finbert_pipeline = pipeline(
                "sentiment-analysis",
                model="ProsusAI/finbert",
                tokenizer="ProsusAI/finbert"
            )
            print("[ML] FinBERT loaded successfully.")
        except Exception as e:
            print(f"[ML] Notice: FinBERT could not be loaded ({e}), using fast rule-based sentiment.")
            _finbert_pipeline = "fallback"
    return _finbert_pipeline


def get_finbert():
    """Get the loaded FinBERT pipeline (lazy fallback if not preloaded)."""
    global _finbert_pipeline
    if _finbert_pipeline is None:
        load_finbert()
    return _finbert_pipeline


def _rule_based_sentiment(text: str) -> dict:
    """Fast, dependency-free sentiment analysis fallback for financial headlines."""
    pos_words = {'surge', 'gain', 'profit', 'rise', 'jump', 'up', 'high', 'record', 'growth', 'bullish', 'strong', 'beat', 'rally', 'boost', 'positive'}
    neg_words = {'drop', 'fall', 'loss', 'down', 'low', 'plunge', 'decline', 'bearish', 'weak', 'miss', 'slump', 'crash', 'negative', 'warning', 'risk'}
    words = set(text.lower().split())
    pos_count = len(words & pos_words)
    neg_count = len(words & neg_words)

    if pos_count > neg_count:
        return {'label': 'positive', 'score': 0.75}
    elif neg_count > pos_count:
        return {'label': 'negative', 'score': 0.75}
    return {'label': 'neutral', 'score': 0.60}


def get_market_sentiment(ticker: str) -> dict:
    """
    Fetches news headlines for a given ticker and returns:
    - score: float between -1.0 and 1.0 (confidence-weighted)
    - confidence: average confidence of the model
    - headlines: list of top 5 headline strings with sentiment + confidence
    """
    pipe = get_finbert()

    stock = yf.Ticker(ticker)
    news = stock.news

    if not news:
        return {"score": 0.0, "confidence": 0.0, "headlines": []}

    headlines = []
    for item in news:
        content = item.get('content', item)
        title = content.get('title', '') or item.get('title', '')
        if title:
            headlines.append(title)

    if not headlines:
        return {"score": 0.0, "confidence": 0.0, "headlines": []}

    # Analyze sentiment for each headline
    if pipe and pipe != "fallback":
        try:
            results = pipe(headlines[:3])
        except Exception:
            results = [_rule_based_sentiment(h) for h in headlines[:3]]
    else:
        results = [_rule_based_sentiment(h) for h in headlines[:3]]

    scored_headlines = []
    weighted_score = 0.0
    total_confidence = 0.0
    valid_results = 0

    for hl, res in zip(headlines[:3], results):
        label = res.get('label', '').lower()
        confidence = round(res.get('score', 0.5), 3)  # FinBERT confidence

        if label == 'positive':
            weighted_score += confidence  # Confidence-weighted positive
            valid_results += 1
            total_confidence += confidence
            scored_headlines.append({
                "text": hl,
                "sentiment": "positive",
                "confidence": confidence
            })
        elif label == 'negative':
            weighted_score -= confidence  # Confidence-weighted negative
            valid_results += 1
            total_confidence += confidence
            scored_headlines.append({
                "text": hl,
                "sentiment": "negative",
                "confidence": confidence
            })
        elif label == 'neutral':
            valid_results += 1
            total_confidence += confidence
            scored_headlines.append({
                "text": hl,
                "sentiment": "neutral",
                "confidence": confidence
            })

    avg_score = weighted_score / valid_results if valid_results > 0 else 0.0
    avg_confidence = total_confidence / valid_results if valid_results > 0 else 0.0

    # Sort by confidence (highest first)
    scored_headlines.sort(key=lambda x: x['confidence'], reverse=True)

    return {
        "score": round(avg_score, 3),
        "confidence": round(avg_confidence, 3),
        "headlines": scored_headlines[:5]  # Return top 5
    }


if __name__ == "__main__":
    test_ticker = "RELIANCE.NS"
    print(f"Testing sentiment for {test_ticker}")
    result = get_market_sentiment(test_ticker)
    print(f"Score: {result['score']} (confidence: {result['confidence']})")
    for hl in result['headlines']:
        print(f"  [{hl['sentiment']} {hl['confidence']:.0%}] {hl['text']}")
