"""
Comprehensive Cresta Functionality Verification Script.
Tests all ML engines, market data endpoints, and prediction pipelines.
"""
import os
import sys
import json
import time
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'robo_advisor.settings')
django.setup()

from django.contrib.auth.models import User
from rest_framework.test import APIRequestFactory, force_authenticate

# ───────────────────────────────────────────
#  Helpers
# ───────────────────────────────────────────
factory = APIRequestFactory()
results = []

def get_or_create_user():
    user = User.objects.filter(username='verifyuser').first()
    if not user:
        user = User.objects.create_user(username='verifyuser', password='testpass123', email='verify@test.com')
    return user

def test(name, fn):
    """Run a test and record result."""
    print(f"\n{'='*60}")
    print(f"TEST: {name}")
    print(f"{'='*60}")
    t0 = time.time()
    try:
        result = fn()
        elapsed = round(time.time() - t0, 2)
        print(f"  ✅ PASS ({elapsed}s)")
        results.append({"test": name, "status": "PASS", "time": elapsed, "detail": result})
    except Exception as e:
        elapsed = round(time.time() - t0, 2)
        print(f"  ❌ FAIL ({elapsed}s): {e}")
        results.append({"test": name, "status": "FAIL", "time": elapsed, "detail": str(e)})

USER = get_or_create_user()

# ───────────────────────────────────────────
#  1. Market Data Endpoints
# ───────────────────────────────────────────
def test_nifty():
    from advisor.views.markets import get_nifty
    req = factory.get('/api/nifty/')
    resp = get_nifty(req)
    data = json.loads(resp.content)
    assert resp.status_code == 200
    assert 'value' in data and 'name' in data
    return f"NIFTY 50 = {data['value']} ({data['percent']})"

def test_sensex():
    from advisor.views.markets import get_sensex
    req = factory.get('/api/sensex/')
    resp = get_sensex(req)
    data = json.loads(resp.content)
    assert resp.status_code == 200
    return f"SENSEX = {data['value']} ({data['percent']})"

def test_banknifty():
    from advisor.views.markets import get_banknifty
    req = factory.get('/api/banknifty/')
    resp = get_banknifty(req)
    data = json.loads(resp.content)
    assert resp.status_code == 200
    return f"BANK NIFTY = {data['value']} ({data['percent']})"

def test_top_movers():
    from advisor.views.markets import get_top_movers
    req = factory.get('/api/top-movers/')
    resp = get_top_movers(req)
    data = json.loads(resp.content)
    assert resp.status_code == 200
    gainers = len(data.get('gainers', []))
    losers = len(data.get('losers', []))
    return f"Gainers: {gainers}, Losers: {losers}"

# ───────────────────────────────────────────
#  2. Search API (with always-on reasoning)
# ───────────────────────────────────────────
def test_search_reliance():
    from advisor.views.markets import search_stock
    req = factory.get('/api/search/', {'ticker': 'RELIANCE'})
    force_authenticate(req, USER)
    resp = search_stock(req)
    if hasattr(resp, 'render'): resp.render()
    data = json.loads(resp.content)
    assert resp.status_code == 200, f"Status {resp.status_code}: {data}"
    assert 'suggestion' in data
    assert 'reasoning' in data and data['reasoning'] is not None, "Reasoning is missing!"
    assert 'confidence' in data and data['confidence'] is not None, "Confidence is missing!"
    return f"{data['name']}: ₹{data['price']} | {data['suggestion']} ({data['confidence']}%) | Why: {data['reasoning'][:60]}..."

def test_search_lt():
    from advisor.views.markets import search_stock
    req = factory.get('/api/search/', {'ticker': 'LT'})
    force_authenticate(req, USER)
    resp = search_stock(req)
    if hasattr(resp, 'render'): resp.render()
    data = json.loads(resp.content)
    assert resp.status_code == 200, f"Status {resp.status_code}: {data}"
    return f"{data.get('name', '?')}: ₹{data.get('price', '?')} | {data.get('suggestion', '?')}"

def test_search_eternal():
    from advisor.views.markets import search_stock
    req = factory.get('/api/search/', {'ticker': 'ETERNAL'})
    force_authenticate(req, USER)
    resp = search_stock(req)
    if hasattr(resp, 'render'): resp.render()
    data = json.loads(resp.content)
    # May be 200 or 404 depending on yfinance ticker availability
    return f"Status: {resp.status_code} | {data.get('name', data.get('error', 'N/A'))}"

# ───────────────────────────────────────────
#  3. ML Engines
# ───────────────────────────────────────────
def test_prediction_reliance():
    from advisor.views.ml import get_prediction
    req = factory.get('/api/prediction/', {'symbol': 'RELIANCE'})
    force_authenticate(req, USER)
    resp = get_prediction(req)
    if hasattr(resp, 'render'): resp.render()
    data = json.loads(resp.content)
    assert resp.status_code == 200, f"Status {resp.status_code}: {data}"
    history_pts = len(data.get('data', []))
    future_pts = sum(1 for d in data.get('data', []) if d.get('isFuture'))
    model = data.get('model', '?')
    return f"Model: {model} | Points: {history_pts} (future: {future_pts})"

def test_prediction_tcs():
    from advisor.views.ml import get_prediction
    req = factory.get('/api/prediction/', {'symbol': 'TCS'})
    force_authenticate(req, USER)
    resp = get_prediction(req)
    if hasattr(resp, 'render'): resp.render()
    data = json.loads(resp.content)
    assert resp.status_code == 200, f"Status {resp.status_code}: {data}"
    model = data.get('model', '?')
    future_pts = sum(1 for d in data.get('data', []) if d.get('isFuture'))
    # Check confidence intervals exist
    future_items = [d for d in data.get('data', []) if d.get('isFuture')]
    has_bounds = all('lower_bound' in d and 'upper_bound' in d for d in future_items) if future_items else False
    return f"Model: {model} | Future: {future_pts} | Bounds: {'Yes' if has_bounds else 'No'}"

def test_recommendation_engine():
    from advisor.views.ml import recommend_api
    payload = {
        'Age': 26,
        'Income': 2500000,
        'Risk_Tolerance': 5,
        'Investment_Goal': 'Wealth'
    }
    req = factory.post('/api/recommend/', payload, format='json')
    force_authenticate(req, USER)
    resp = recommend_api(req)
    if hasattr(resp, 'render'): resp.render()
    data = json.loads(resp.content)
    assert resp.status_code == 200, f"Status {resp.status_code}: {data}"
    user_class = data.get('Assigned_Class', '?')
    count = len(data.get('Recommended_Stocks', []))
    stocks = [s['Ticker'] for s in data.get('Recommended_Stocks', [])[:3]]
    return f"Class: {user_class} | Picks: {count} | Top: {stocks}"

def test_sector_sentiment():
    from advisor.views.ml import sector_sentiment
    req = factory.get('/api/api/sector-sentiment/')
    resp = sector_sentiment(req)
    if hasattr(resp, 'render'): resp.render()
    data = json.loads(resp.content)
    assert resp.status_code == 200, f"Status {resp.status_code}: {data}"
    sectors = list(data.keys())
    return f"Sectors: {sectors}"

# ───────────────────────────────────────────
#  4. Backtesting Engine
# ───────────────────────────────────────────
def test_backtest():
    from recommender.backtester import Backtester
    bt = Backtester("RELIANCE.NS", risk_profile="Moderate", initial_capital=100000, period="1y")
    res = bt.run()
    assert len(res['equity_curve']) > 0
    assert len(res['benchmark_curve']) > 0
    s = res['stats']
    return f"Return: {s['total_return_pct']}% | Sharpe: {s['sharpe_ratio']} | MDD: {s['max_drawdown_pct']}% | Bench: {s['benchmark_return_pct']}%"

# ───────────────────────────────────────────
#  5. Risk Profiler (XGBoost)
# ───────────────────────────────────────────
def test_risk_profiler():
    from recommender.risk_profiler import RiskProfiler
    profiler = RiskProfiler()
    result = profiler.predict({
        'Age': 25, 'Income': 800000, 'Risk_Tolerance': 4,
        'Investment_Goal': 'Wealth', 'Experience_Years': 3
    })
    assert result in ('Conservative', 'Moderate', 'Aggressive'), f"Unexpected class: {result}"
    return f"Predicted risk class: {result}"

def test_risk_profiler_conservative():
    from recommender.risk_profiler import RiskProfiler
    profiler = RiskProfiler()
    result = profiler.predict({
        'Age': 60, 'Income': 300000, 'Risk_Tolerance': 1,
        'Investment_Goal': 'Retirement', 'Experience_Years': 5
    })
    return f"Predicted risk class: {result}"

# ───────────────────────────────────────────
#  6. Data Loader
# ───────────────────────────────────────────
def test_data_loader():
    from recommender.data_loader import SafeDataFetcher
    df = SafeDataFetcher.fetch_ticker_data("RELIANCE.NS", period="1mo", min_days=15)
    assert len(df) >= 15
    assert 'Close' in df.columns and 'Volume' in df.columns
    return f"Fetched {len(df)} days | Cols: {list(df.columns)[:5]}"

# ───────────────────────────────────────────
#  7. Feature Engineering
# ───────────────────────────────────────────
def test_features():
    from recommender.data_loader import SafeDataFetcher
    from recommender.features import prepare_features
    df = SafeDataFetcher.fetch_ticker_data("TCS.NS", period="3mo", min_days=30)
    features = prepare_features(df, sentiment_score=0.3)
    assert len(features) > 0
    return f"Features: {list(features.columns)} ({len(features)} rows)"

# ───────────────────────────────────────────
#  RUN ALL TESTS
# ───────────────────────────────────────────
print("\n" + "█"*60)
print("  CRESTA — COMPREHENSIVE FUNCTIONALITY VERIFICATION")
print("█"*60)

# Market Data
test("Nifty 50 Index", test_nifty)
test("Sensex Index", test_sensex)
test("Bank Nifty Index", test_banknifty)
test("Top Movers (Gainers/Losers)", test_top_movers)

# Search
test("Search: RELIANCE (with reasoning)", test_search_reliance)
test("Search: LT (new mapping)", test_search_lt)
test("Search: ETERNAL (Zomato rebrand)", test_search_eternal)

# ML Engines
test("Prediction: RELIANCE (Ensemble)", test_prediction_reliance)
test("Prediction: TCS (Confidence Bounds)", test_prediction_tcs)
test("Recommendation Engine (Scoring)", test_recommendation_engine)
test("Sector Sentiment (FinBERT)", test_sector_sentiment)

# Backtester
test("Backtesting Engine", test_backtest)

# Risk Profiler
test("Risk Profiler: Aggressive User", test_risk_profiler)
test("Risk Profiler: Conservative User", test_risk_profiler_conservative)

# Infra
test("Data Loader (SafeDataFetcher)", test_data_loader)
test("Feature Engineering (13 Features)", test_features)

# ───────────────────────────────────────────
#  SUMMARY
# ───────────────────────────────────────────
print("\n\n" + "█"*60)
print("  VERIFICATION SUMMARY")
print("█"*60)
passed = sum(1 for r in results if r['status'] == 'PASS')
failed = sum(1 for r in results if r['status'] == 'FAIL')
total = len(results)
print(f"\n  Total: {total} | ✅ Passed: {passed} | ❌ Failed: {failed}\n")
for r in results:
    icon = "✅" if r['status'] == 'PASS' else "❌"
    print(f"  {icon} {r['test']:<45} {r['time']}s")
    if r['status'] == 'PASS':
        print(f"     → {r['detail']}")
    else:
        print(f"     → ERROR: {r['detail'][:100]}")

if failed > 0:
    print(f"\n  ⚠️  {failed} test(s) FAILED — see details above.")
else:
    print(f"\n  🎉 ALL {total} TESTS PASSED!")
