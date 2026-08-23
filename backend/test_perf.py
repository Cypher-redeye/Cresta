import time
import sys
import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "robo_advisor.settings")
django.setup()

from recommender.ensemble_predictor import ensemble_predict

ticker = sys.argv[1]
print(f"Testing {ticker}...", flush=True)

start = time.time()
res = ensemble_predict(ticker)
end = time.time()

print(f"\nTotal Time: {end-start:.2f}s")
print(f"Metrics: {res.get('metrics', {})}")
