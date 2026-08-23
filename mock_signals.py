import pandas as pd
import numpy as np
import yfinance as yf
from datetime import timedelta
import os

# Create a mock signals.csv with strong buys for RELIANCE.NS and TCS.NS
TICKERS = ["RELIANCE.NS", "TCS.NS"]

# Fetch last 30 days of market dates
hist = yf.Ticker("RELIANCE.NS").history(period="1y")
dates = hist.index[-30:].strftime('%Y-%m-%d').tolist()

mock_data = []
for ticker in TICKERS:
    for date_str in dates:
        mock_data.append({
            "ticker": ticker,
            "date": date_str,
            "predicted_return": 0.05,  # 5% strong buy
            "lower_bound_return": 0.02, # Solid confidence
            "bound_width": 0.06
        })

df = pd.DataFrame(mock_data)
signals_path = os.path.join(os.path.dirname(__file__), "backend", "signals.csv")
df.to_csv(signals_path, index=False)
print(f"Mock signals.csv created at {signals_path}")
