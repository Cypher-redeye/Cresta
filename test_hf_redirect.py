import urllib.request
import urllib.error

url = 'https://omsharma38-cresta-backend.hf.space/api/auth/google/'
req = urllib.request.Request(url, method='POST', data=b'{}', headers={'Content-Type': 'application/json'})

try:
    with urllib.request.urlopen(req) as response:
        print('Status:', response.status)
        print('Body:', response.read().decode()[:200])
except urllib.error.HTTPError as e:
    print('HTTPError:', e.code)
    print('Headers:', e.headers)
    print('Body:', e.read().decode()[:200])
except Exception as e:
    print('Error:', e)
