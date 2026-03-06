from django.db import models
from django.contrib.auth.models import User


class UserProfile(models.Model):
    """Extended user profile linked to Django User."""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    risk_score = models.IntegerField(null=True, blank=True)
    risk_profile = models.CharField(max_length=20, blank=True, default='')   # Conservative/Balanced/Aggressive
    investment_goal = models.CharField(max_length=50, blank=True, default='')
    age = models.IntegerField(null=True, blank=True)
    income = models.IntegerField(null=True, blank=True)
    picture = models.URLField(blank=True, default='')
    last_assessment_date = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.email} — {self.risk_profile or 'No profile'}"


class Holding(models.Model):
    """User's stock holding — linked to Django User."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='holdings')
    user_email = models.EmailField(db_index=True, blank=True, default='')
    ticker = models.CharField(max_length=20)
    name = models.CharField(max_length=100)
    qty = models.IntegerField(default=0)
    avg_price = models.FloatField(default=0.0)
    purchase_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('user', 'ticker')
        ordering = ['-updated_at']

    def __str__(self):
        return f"{self.user.email} - {self.ticker} x{self.qty}"


class Transaction(models.Model):
    """Buy/sell transaction history."""
    TYPE_CHOICES = [('BUY', 'Buy'), ('SELL', 'Sell')]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='transactions')
    ticker = models.CharField(max_length=20)
    name = models.CharField(max_length=100, blank=True, default='')
    transaction_type = models.CharField(max_length=4, choices=TYPE_CHOICES)
    qty = models.IntegerField()
    price = models.FloatField()           # Price per share at time of transaction
    total_value = models.FloatField()     # qty * price
    notes = models.TextField(blank=True, default='')
    transaction_date = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-transaction_date']

    def __str__(self):
        return f"{self.user.email} {self.transaction_type} {self.ticker} x{self.qty} @ ₹{self.price}"


class WatchlistItem(models.Model):
    """User's stock watchlist."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='watchlist')
    ticker = models.CharField(max_length=20)
    name = models.CharField(max_length=100, blank=True, default='')
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'ticker')
        ordering = ['-added_at']

    def __str__(self):
        return f"{self.user.email} watching {self.ticker}"

