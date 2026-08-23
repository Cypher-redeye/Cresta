import requests

urls = [
    'https://icons.duckduckgo.com/ip3/tcs.com.ico',
    'https://icons.duckduckgo.com/ip3/ril.com.ico',
    'https://icons.duckduckgo.com/ip3/apple.com.ico',
    'https://icon.horse/icon/ril.com',
    'https://logo.uplead.com/ril.com'
]

for url in urls:
    try:
        res = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'})
        print(f"{url} -> {res.status_code} ({len(res.content)} bytes)")
    except Exception as e:
        print(f"{url} -> Error: {e}")
