import os
import threading
from django.apps import AppConfig


class AdvisorConfig(AppConfig):
    name = "advisor"
    default_auto_field = "django.db.models.BigAutoField"

    def ready(self):
        """Load ML models in a background thread at startup."""
        # Only load in the main process (avoid double-loading in autoreload)
        if os.environ.get('RUN_MAIN') == 'true' or not os.environ.get('DJANGO_AUTORELOAD'):
            thread = threading.Thread(target=self._load_ml_models, daemon=True)
            thread.start()

    def _load_ml_models(self):
        """Background thread to load FinBERT so first request isn't slow."""
        try:
            from recommender.sentiment import load_finbert
            load_finbert()
        except Exception as e:
            print(f"[ML] Warning: Could not pre-load FinBERT: {e}")
