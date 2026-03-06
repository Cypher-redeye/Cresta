"""
Celery configuration for Cresta robo_advisor project.
"""
import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'robo_advisor.settings')

app = Celery('robo_advisor')
app.config_from_object('django.conf:settings', namespace='CELERY')

# Auto-discover tasks in all installed apps
app.autodiscover_tasks()

# Beat schedule — daily ML refresh at 6 AM IST (00:30 UTC)
app.conf.beat_schedule = {
    'daily-sentiment-precompute': {
        'task': 'advisor.tasks.precompute_sentiment',
        'schedule': 86400.0,  # Every 24 hours
    },
    'daily-lstm-pretrain': {
        'task': 'advisor.tasks.pretrain_lstm_models',
        'schedule': 86400.0,
    },
}
app.conf.timezone = 'Asia/Kolkata'
