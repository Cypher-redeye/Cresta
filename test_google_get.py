import requests

url = 'https://omsharma38-cresta-backend.hf.space/django/api/auth/google/'
try:
    response = requests.get(url, timeout=10)
    print('Status Code:', response.status_code)
    print('Response:', response.text)
except Exception as e:
    print('Error:', e)
