import requests
import json
print('Sending test request...')
headers = {'Content-Type': 'application/json'}
try:
    response = requests.post('http://127.0.0.1:8000/api/auth/signup/', headers=headers, json={'email':'test12345@test.com', 'password':'password123', 'name':'Test User'})
    print('Signup Status:', response.status_code)
    
    response2 = requests.post('http://127.0.0.1:8000/api/auth/login/', headers=headers, json={'username':'test12345@test.com', 'password':'password123'})
    print('Login Status:', response2.status_code)
    print('Headers:', dict(response2.headers))
except Exception as e:
    print('Error:', e)
