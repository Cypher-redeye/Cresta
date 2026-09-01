import requests
try:
    r = requests.post('https://omsharma38-cresta-backend.hf.space/django/api/auth/google/', json={'access_token': 'dummy_token'}, timeout=10)
    print('POST Code:', r.status_code, r.text[:100])
except Exception as e: print(e)
