import pandas as pd
import yfinance as yf
import numpy as np
import os
import warnings

warnings.filterwarnings('ignore')

signals_file = os.path.join(os.path.dirname(__file__), "backend", "signals.csv")
sig_df = pd.read_csv(signals_file)
sig_df['date'] = pd.to_datetime(sig_df['date'])

tickers = sig_df['ticker'].unique()
results = []

print("Calculating accuracy metrics...")

for ticker in tickers:
    ticker_df = sig_df[sig_df['ticker'] == ticker].copy()
    ticker_df.set_index('date', inplace=True)
    
    # Fetch actual data
    start_date = ticker_df.index.min() - pd.Timedelta(days=10)
    end_date = ticker_df.index.max() + pd.Timedelta(days=10)
    
    hist = yf.Ticker(ticker).history(start=start_date, end=end_date)
    hist.index = hist.index.tz_convert(None) if hist.index.tz is not None else hist.index
    hist.index = pd.to_datetime(hist.index.strftime('%Y-%m-%d'))
    
    # Calculate actual T+1 returns
    hist['Actual_T1_Return'] = hist['Close'].shift(-1) / hist['Close'] - 1
    hist['Actual_T1_Price'] = hist['Close'].shift(-1)
    
    # Join
    joined = ticker_df.join(hist[['Actual_T1_Return', 'Actual_T1_Price', 'Close']], how='inner')
    joined.dropna(subset=['Actual_T1_Return'], inplace=True)
    
    if joined.empty:
        continue
        
    # Predicted T+1 Price = Close * (1 + predicted_return)
    joined['Predicted_T1_Price'] = joined['Close'] * (1 + joined['predicted_return'])
    
    # Metrics
    mape = np.mean(np.abs((joined['Actual_T1_Price'] - joined['Predicted_T1_Price']) / joined['Actual_T1_Price'])) * 100
    rmse = np.sqrt(np.mean((joined['Actual_T1_Price'] - joined['Predicted_T1_Price'])**2))
    
    # Directional Accuracy
    actual_dir = np.sign(joined['Actual_T1_Return'])
    pred_dir = np.sign(joined['predicted_return'])
    # Avoid 0 matching 0 artificially (though rare)
    dir_correct = (actual_dir == pred_dir) & (actual_dir != 0)
    dir_acc = dir_correct.mean() * 100
    
    results.append({
        'Ticker': ticker,
        'Days': len(joined),
        'MAPE (%)': round(mape, 2),
        'RMSE': round(rmse, 2),
        'Dir. Accuracy (%)': round(dir_acc, 2)
    })

res_df = pd.DataFrame(results)
print("\n" + "="*50)
print("PREDICTION ACCURACY (Full Mode - Last 1 Year)")
print("="*50)
print(res_df.to_string(index=False))

print("\n--- OVERALL ---")
print(f"Average MAPE: {res_df['MAPE (%)'].mean():.2f}%")
print(f"Average RMSE: {res_df['RMSE'].mean():.2f}")
print(f"Overall Directional Accuracy: {res_df['Dir. Accuracy (%)'].mean():.2f}%")
