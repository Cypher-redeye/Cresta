import requests

urls = [
    'https://logo.clearbit.com/ril.com',
    'https://logo.clearbit.com/relianceindustries.com',
    'https://logo.clearbit.com/tcs.com',
    'https://logo.clearbit.com/wipro.com',
    'https://www.google.com/s2/favicons?domain=tcs.com&sz=128',
    'https://icon.horse/icon/tcs.com'
]

for url in urls:
    try:
        res = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'})
        print(f"{url} -> {res.status_code} ({len(res.content)} bytes)")
    except Exception as e:
        print(f"{url} -> Error: {e}")
