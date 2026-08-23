import os
import sys
import yfinance as yf
import pandas as pd
import csv
import time
from datetime import timedelta
import warnings

warnings.filterwarnings('ignore')

sys.path.append(os.path.dirname(__file__))
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'robo_advisor.settings')
django.setup()

from recommender.ensemble_predictor import ensemble_predict
import recommender.stock_predictor

TICKERS = ["RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "INFY.NS", "ICICIBANK.NS"]
DAYS_TO_PRECOMPUTE = 250 # Full 1 year backtest
OUTPUT_FILE = os.path.join(os.path.dirname(__file__), "signals.csv")

def main():
    print(f"Starting Signal Pre-computation for {len(TICKERS)} tickers over {DAYS_TO_PRECOMPUTE} days.")
    
    # Check if file exists, write header if not
    file_exists = os.path.exists(OUTPUT_FILE)
    
    with open(OUTPUT_FILE, 'a', newline='') as csvfile:
        fieldnames = ['ticker', 'date', 'predicted_return', 'lower_bound_return', 'bound_width']
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        if not file_exists:
            writer.writeheader()

        original_history = yf.Ticker.history
        original_load_saved_model = recommender.stock_predictor.load_saved_model
        original_get_cached_prediction = recommender.stock_predictor.get_cached_prediction

        # Prevent DB cache and disk models to force true walk-forward or fresh fast-mode runs
        recommender.stock_predictor.load_saved_model = lambda t, f=13: (None, None)
        recommender.stock_predictor.get_cached_prediction = lambda t: None

        try:
            for ticker in TICKERS:
                print(f"\nProcessing {ticker}...")
                try:
                    full_hist = original_history(yf.Ticker(ticker), period="2y")
                    if len(full_hist) < DAYS_TO_PRECOMPUTE + 60:
                        print(f"Not enough data for {ticker}. Skipping.")
                        continue
                        
                    for i in range(DAYS_TO_PRECOMPUTE, 0, -1):
                        prediction_date = full_hist.index[-i]
                        # Remove timezone for clean CSV writing
                        if prediction_date.tz is not None:
                            prediction_date = prediction_date.tz_convert(None)
                        date_str = prediction_date.strftime('%Y-%m-%d')
                        
                        # Mock history to only include data up to `prediction_date`
                        def mock_history(self, *args, **kwargs):
                            return full_hist.iloc[:-i+1] if i > 1 else full_hist
                        yf.Ticker.history = mock_history
                        
                        # Predict next day (forecast_days=1)
                        # We use fast_mode=False for the production-grade run
                        pred_result = ensemble_predict(ticker, forecast_days=1, fast_mode=False)
                        
                        if not pred_result or 'predictions' not in pred_result or not pred_result['predictions']:
                            continue
                            
                        pred_t1 = pred_result['predictions'][0]
                        current_price = float(full_hist.iloc[-i]['Close'])
                        
                        pred_price = pred_t1['price']
                        lower_bound = pred_t1.get('lower_bound', pred_price)
                        upper_bound = pred_t1.get('upper_bound', pred_price)
                        
                        predicted_return = (pred_price - current_price) / current_price
                        lower_bound_return = (lower_bound - current_price) / current_price
                        bound_width = (upper_bound - lower_bound) / current_price
                        
                        writer.writerow({
                            'ticker': ticker,
                            'date': date_str,
                            'predicted_return': round(predicted_return, 4),
                            'lower_bound_return': round(lower_bound_return, 4),
                            'bound_width': round(bound_width, 4)
                        })
                        csvfile.flush()
                        
                        print(f"  {date_str}: Ret {predicted_return:+.4f} | LBound {lower_bound_return:+.4f} | Width {bound_width:.4f}")
                        
                except Exception as e:
                    print(f"Error processing {ticker}: {e}")
        finally:
            yf.Ticker.history = original_history
            recommender.stock_predictor.load_saved_model = original_load_saved_model
            recommender.stock_predictor.get_cached_prediction = original_get_cached_prediction

    print(f"\nDone! Signals saved to {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
