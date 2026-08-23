import requests
import json
print('Sending test request...')
headers = {'Content-Type': 'application/json'}
data = {'access_token': 'fake'}
try:
    response = requests.post('http://localhost:5173/api/auth/login/', headers=headers, json={'username':'om2317160@gmail.com', 'password':'password'})
    print('Status:', response.status_code)
    print('Headers:', dict(response.headers))
    print('Body:', response.text)
except Exception as e:
    print('Error:', e)
