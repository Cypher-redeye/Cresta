import json
import yfinance as yf
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status

from ..serializers import RecommendSerializer


@api_view(['POST'])
@permission_classes([AllowAny])
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

        # Update last_assessment_date if user is authenticated
        if request.user.is_authenticated:
            from ..models import UserProfile
            from django.utils import timezone
            profile, _ = UserProfile.objects.get_or_create(user=request.user)
            profile.last_assessment_date = timezone.now()
            profile.save(update_fields=['last_assessment_date'])

        return Response(result_dict)
    except Exception as e:
        print(f"Error in recommend_api: {e}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_prediction(request):
    symbol = request.query_params.get('symbol')
    if not symbol:
        return Response({"error": "Symbol required"}, status=status.HTTP_400_BAD_REQUEST)

    # Ticker alias mapping
    TICKER_ALIASES = {
        'INFOSYS': 'INFY', 'TATAMOTORS': 'TATAMTRDVR', 'BAJAJFINSERV': 'BAJFINANCE',
        'STATEBANK': 'SBIN', 'SBI': 'SBIN',
    }
    base = symbol.upper().replace('.NS', '').replace('.BO', '')
    if base in TICKER_ALIASES:
        symbol = TICKER_ALIASES[base]

    # Auto-append .NS
    if not symbol.endswith('.NS') and not symbol.endswith('.BO') and not symbol.startswith('^'):
        symbol = f"{symbol}.NS"

    try:
        # Tier 2: Use ensemble predictor (LSTM + XGBoost + ARIMA)
        from recommender.ensemble_predictor import ensemble_predict
        result = ensemble_predict(symbol)
        combined_data = result['history'] + result['predictions']

        return Response({
            "symbol": symbol,
            "data": combined_data,
            "model": "Ensemble (AttentionLSTM + XGBoost + ARIMA)",
            "metrics": result.get('metrics', {}),
            "model_breakdown": result.get('model_breakdown', {})
        })

    except Exception as ensemble_error:
        print(f"Ensemble failed for {symbol}: {ensemble_error}")

        # Fallback to LSTM only
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
                predictions.append({
                    "date": next_date.strftime('%Y-%m-%d'),
                    "price": round(pred_price, 2),
                    "isFuture": True
                })

            return Response({
                "symbol": symbol,
                "data": history + predictions,
                "model": "Trend (fallback)"
            })
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
