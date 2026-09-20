import os
import threading
from django.apps import AppConfig


class AdvisorConfig(AppConfig):
    name = "advisor"
    default_auto_field = "django.db.models.BigAutoField"

    def ready(self):
        """App startup hook. FinBERT loads lazily on first use to avoid OOM."""
        # FinBERT is loaded on-demand via get_finbert() in sentiment.py.
        # Eager loading was removed because it caused OOM kills on
        # memory-constrained servers. The rule-based fallback in
        # sentiment.py handles the case where FinBERT can't load.
        pass
