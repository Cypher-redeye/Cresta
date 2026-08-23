import json
import yfinance as yf
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from ..serializers import RecommendSerializer


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def recommend_api(request):
    """
    Expects POST request with JSON containing:
    Age, Income, Risk_Tolerance, Investment_Goal
    Optionally: lang (en/hi/gu/pa)
    """
    serializer = RecommendSerializer(data=request.data)
    if not serializer.is_valid():
        return Response({'error': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    try:
        from recommender.engine import recommend_stocks
        lang = request.data.get('lang', 'en')
        result_json_str = recommend_stocks(serializer.validated_data, lang=lang)
        result_dict = json.loads(result_json_str)

        # Update user profile if authenticated
        if request.user.is_authenticated:
            from ..models import UserProfile
            from django.utils import timezone
            
            profile, _ = UserProfile.objects.get_or_create(user=request.user)
            profile.last_assessment_date = timezone.now()
            
            # Map Risk_Tolerance (1-5) to profile strings
            risk_val = serializer.validated_data['Risk_Tolerance']
            if risk_val <= 2: profile.risk_profile = 'Conservative'
            elif risk_val == 3: profile.risk_profile = 'Balanced'
            else: profile.risk_profile = 'Aggressive'
            
            profile.risk_score = risk_val
            profile.investment_goal = serializer.validated_data['Investment_Goal']
            profile.age = serializer.validated_data['Age']
            profile.income = serializer.validated_data['Income']
            
            profile.save()

        return Response(result_dict)
    except Exception as e:
        print(f"Error in recommend_api: {e}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def _fallback_prediction(symbol):
    try:
        ticker = yf.Ticker(symbol)
        df = ticker.history(period="1mo")

        if df.empty:
            return Response({"error": "No data"}, status=status.HTTP_404_NOT_FOUND)

        history = []
        for index, row in df.iterrows():
            history.append({
                "date": index.strftime('%Y-%m-%d'),
                "price": round(row['Close'], 2),
                "isFuture": False
            })

        last_price = history[-1]['price']
        recent_trend = (last_price - history[max(0, len(history)-5)]['price']) / 5

        from datetime import timedelta
        last_date = df.index[-1]

        predictions = []
        for i in range(1, 8):
            next_date = last_date + timedelta(days=i)
            pred_price = last_price + (recent_trend * i) + (last_price * 0.005 * (i ** 0.5))
            margin = last_price * 0.02 * (i ** 0.5)  # ±2% widening band
            predictions.append({
                "date": next_date.strftime('%Y-%m-%d'),
                "price": round(pred_price, 2),
                "lower_bound": round(pred_price - margin, 2),
                "upper_bound": round(pred_price + margin, 2),
                "isFuture": True
            })

        return Response({
            "symbol": symbol,
            "data": history + predictions,
            "model": "Trend (fallback)",
            "status": "completed"
        })
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_prediction(request):
    symbol = request.query_params.get('symbol')
    if not symbol:
        return Response({"error": "Symbol required"}, status=status.HTTP_400_BAD_REQUEST)

    # Ticker alias mapping
    TICKER_ALIASES = {
        'INFOSYS': 'INFY', 'TATAMOTORS': 'TATAMTRDVR', 'BAJAJFINSERV': 'BAJFINANCE',
        'STATEBANK': 'SBIN', 'SBI': 'SBIN',
        'LT': 'LT', 'LARSEN': 'LT', 'L&T': 'LT',
        'ETERNAL': 'ETERNAL', 'ZOMATO': 'ETERNAL',
        'TATA MOTORS': 'TATAMOTORS', 'TATA STEEL': 'TATASTEEL',
        'ADANI': 'ADANIENT', 'ADANI ENTERPRISES': 'ADANIENT',
    }
    base = symbol.upper().replace('.NS', '').replace('.BO', '')
    if base in TICKER_ALIASES:
        symbol = TICKER_ALIASES[base]

    # Auto-append .NS
    if not symbol.endswith('.NS') and not symbol.endswith('.BO') and not symbol.startswith('^'):
        symbol = f"{symbol}.NS"

    try:
        from recommender.stock_predictor import get_cached_prediction
        cached = get_cached_prediction(symbol)
        if cached:
            combined_data = cached['history'] + cached['predictions']
            return Response({
                "symbol": symbol,
                "data": combined_data,
                "model": "Ensemble (AttentionLSTM + XGBoost + ARIMA)",
                "metrics": cached.get('metrics', {}),
                "model_breakdown": cached.get('model_breakdown', {}),
                "status": "completed"
            })

        from advisor.tasks import run_ensemble_prediction_task
        task = run_ensemble_prediction_task.delay(symbol, fast_mode=True)
        return Response({
            "symbol": symbol,
            "task_id": task.id,
            "status": "processing"
        })

    except Exception as ensemble_error:
        print(f"Ensemble task start failed for {symbol}: {ensemble_error}")
        return _fallback_prediction(symbol)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_prediction_status(request, task_id):
    from celery.result import AsyncResult
    symbol = request.query_params.get('symbol', 'UNKNOWN')
    
    # Ticker alias mapping (reuse from get_prediction)
    TICKER_ALIASES = {
        'INFOSYS': 'INFY', 'TATAMOTORS': 'TATAMTRDVR', 'BAJAJFINSERV': 'BAJFINANCE',
        'STATEBANK': 'SBIN', 'SBI': 'SBIN',
        'LT': 'LT', 'LARSEN': 'LT', 'L&T': 'LT',
        'ETERNAL': 'ETERNAL', 'ZOMATO': 'ETERNAL',
        'TATA MOTORS': 'TATAMOTORS', 'TATA STEEL': 'TATASTEEL',
        'ADANI': 'ADANIENT', 'ADANI ENTERPRISES': 'ADANIENT',
    }
    base = symbol.upper().replace('.NS', '').replace('.BO', '')
    if base in TICKER_ALIASES:
        symbol = TICKER_ALIASES[base]

    if not symbol.endswith('.NS') and not symbol.endswith('.BO') and not symbol.startswith('^'):
        symbol = f"{symbol}.NS"
        
    task = AsyncResult(task_id)
    
    if task.state == 'PENDING' or task.state == 'STARTED':
        return Response({'status': 'processing'})
    elif task.state == 'SUCCESS':
        task_result = task.result
        if task_result.get('status') == 'SUCCESS':
            result = task_result['result']
            combined_data = result['history'] + result['predictions']
            return Response({
                "status": "completed",
                "data": combined_data,
                "model": "Ensemble (AttentionLSTM + XGBoost + ARIMA)",
                "metrics": result.get('metrics', {}),
                "model_breakdown": result.get('model_breakdown', {})
            })
        else:
            return _fallback_prediction(symbol)
    elif task.state == 'FAILURE':
        return _fallback_prediction(symbol)
    else:
        return Response({'status': task.state})


@api_view(['GET'])
@permission_classes([AllowAny])
def sector_sentiment(request):
    """
    Returns FinBERT sentiment for all Nifty50 stocks
    grouped by sector — used by SectorHeatmap component.
    """
    from django.core.cache import cache
    
    sectors = {
        'IT': ['TCS.NS', 'INFY.NS', 'WIPRO.NS', 'HCLTECH.NS'],
        'Banking': ['HDFCBANK.NS', 'ICICIBANK.NS', 'SBIN.NS'],
        'Energy': ['RELIANCE.NS', 'ONGC.NS', 'NTPC.NS'],
        'Auto': ['MARUTI.NS', 'TATAMOTORS.NS'],
        'Pharma': ['SUNPHARMA.NS', 'DRREDDY.NS'],
    }
    
    result = {}
    for sector, tickers in sectors.items():
        result[sector] = {}
        for ticker in tickers:
            # Assuming sentiment scores are stored in cache as floats
            sentiment = cache.get(f"sentiment:{ticker}", 0)
            
            # If not in cache, try fetching from dict structure used by get_cached_sentiment
            if sentiment == 0:
                try:
                    from advisor.tasks import get_cached_sentiment
                    data = get_cached_sentiment(ticker)
                    sentiment = data.get('score', 0.0)
                except Exception:
                    sentiment = 0.0
                    
            result[sector][ticker] = sentiment
            
    return Response(result)
