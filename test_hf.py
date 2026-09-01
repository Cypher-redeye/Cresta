import urllib.request
import json

url = 'https://omsharma38-cresta-backend.hf.space/api/auth/google/'
req = urllib.request.Request(url, method='POST', headers={'Content-Type': 'application/json'}, data=b'{}')
try:
    with urllib.request.urlopen(req) as response:
        print(response.read().decode())
except urllib.error.HTTPError as e:
    print(f'HTTP Error {e.code}:')
    print(e.read().decode())
