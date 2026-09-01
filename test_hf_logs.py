import urllib.request
import json

url = 'https://huggingface.co/api/spaces/OMSharma38/cresta-backend'
req = urllib.request.Request(url)
try:
    with urllib.request.urlopen(req) as response:
        print(response.read().decode()[:500])
except Exception as e:
    print(f'Error: {e}')
