from rest_framework import serializers


class GoogleAuthSerializer(serializers.Serializer):
    access_token = serializers.CharField(required=True)


class HoldingSerializer(serializers.Serializer):
    ticker = serializers.CharField(max_length=20)
    qty = serializers.IntegerField(min_value=1)
    avg_price = serializers.FloatField(min_value=0.01)
    purchase_date = serializers.DateField(required=False, allow_null=True)


class HoldingUpdateSerializer(serializers.Serializer):
    id = serializers.IntegerField(required=True)
    qty = serializers.IntegerField(required=False, min_value=0)
    avg_price = serializers.FloatField(required=False, min_value=0.01)
    purchase_date = serializers.DateField(required=False, allow_null=True)


class HoldingDeleteSerializer(serializers.Serializer):
    id = serializers.IntegerField(required=True)


class RecommendSerializer(serializers.Serializer):
    Age = serializers.IntegerField(min_value=1, max_value=120)
    Income = serializers.IntegerField(min_value=0)
    Risk_Tolerance = serializers.IntegerField(min_value=1, max_value=5)
    Investment_Goal = serializers.CharField(max_length=50)


class UserProfileSerializer(serializers.Serializer):
    risk_score = serializers.IntegerField(required=False, allow_null=True)
    risk_profile = serializers.CharField(max_length=20, required=False, allow_blank=True)
    investment_goal = serializers.CharField(max_length=50, required=False, allow_blank=True)
    age = serializers.IntegerField(required=False, allow_null=True)
    income = serializers.IntegerField(required=False, allow_null=True)


class WatchlistSerializer(serializers.Serializer):
    ticker = serializers.CharField(max_length=20)
