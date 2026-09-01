import requests

try:
    r1 = requests.get('https://omsharma38-cresta-backend.hf.space/django/health/', timeout=10)
    print('/django/health/ ->', r1.status_code, r1.text[:100])
except Exception as e: print(e)

try:
    r2 = requests.post('https://omsharma38-cresta-backend.hf.space/django/nonexistent/', timeout=10)
    print('POST /django/nonexistent/ ->', r2.status_code, r2.text[:100])
except Exception as e: print(e)

try:
    r3 = requests.post('https://omsharma38-cresta-backend.hf.space/nonexistent/', timeout=10)
    print('POST /nonexistent/ ->', r3.status_code, r3.text[:100])
except Exception as e: print(e)

try:
    r4 = requests.get('https://omsharma38-cresta-backend.hf.space/django/api/auth/google/', timeout=10)
    print('GET /django/api/auth/google/ ->', r4.status_code, r4.text[:100])
except Exception as e: print(e)
