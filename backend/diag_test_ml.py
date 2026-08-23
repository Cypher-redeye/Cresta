import os
import sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'robo_advisor.settings')
import django
django.setup()

from recommender.engine import recommend_stocks

try:
    print("Running recommend_stocks...")
    res = recommend_stocks({
        'Age': 25, 
        'Income': 700000, 
        'Risk_Tolerance': 3, 
        'Investment_Goal': 'Wealth'
    })
    print("SUCCESS")
    print(res[:200])
except Exception as e:
    print("ERROR CAUGHT:")
    import traceback
    traceback.print_exc()
