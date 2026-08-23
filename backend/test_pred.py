import requests

# Test 1: Fetch from Prediction API directly using a valid JWT (or without if we can spoof it)
# We can bypass auth and just call _fallback_prediction locally to see what happens
from django.conf import settings
import os
import sys

# Add backend directory to python path
sys.path.append(r"C:\Users\om231\OneDrive\Desktop\Projects\Cresta\backend")
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
import django
django.setup()

from advisor.views.ml import _fallback_prediction

response = _fallback_prediction("RELIANCE.NS")
print(response.status_code)
print(response.data)
