import requests
url = 'https://omsharma38-cresta-backend.hf.space/django/api/auth/google/'
try:
    response = requests.post(url, json={'access_token': 'dummy_token'}, timeout=10)
    print('Status Code:', response.status_code)
    print('Response:', response.text[:200])
except Exception as e:
    print('Error:', e)
