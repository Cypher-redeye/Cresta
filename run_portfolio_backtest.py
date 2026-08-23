import sys
import os

# Adjust paths
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'robo_advisor.settings')
django.setup()

from recommender.backtester import backtest_portfolio

TICKERS = [
    "RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "INFY.NS", "ICICIBANK.NS",
]

if __name__ == "__main__":
    print("Running portfolio backtest...")
    result = backtest_portfolio(TICKERS, risk_profile="Moderate", initial_capital=100000.0, period="1y")
    
    print("\n" + "="*50)
    print("=== PORTFOLIO BACKTEST SUMMARY ===")
    print("="*50)
    
    stats = result['aggregate_stats']
    print(f"Total Return: {stats['total_return_pct']}%")
    print(f"CAGR: {stats['cagr_pct']}%")
    print(f"Sharpe Ratio: {stats['sharpe_ratio']}")
    print(f"Max Drawdown: {stats['max_drawdown_pct']}%")
    print(f"Tickers Succeeded: {stats['tickers_succeeded']} / {len(TICKERS)}")
    print(f"Final Equity: Rs. {stats['final_equity']}")
    print("="*50)
    
    print("\n--- Per Ticker Breakdown ---")
    for t in result['per_ticker']:
        t_stats = t['stats']
        print(f"{t['ticker']:<15} | Return: {t_stats['total_return_pct']:>6}% | Win Rate: {t_stats['win_rate_pct']:>5}% | Trades: {t_stats['total_trades']}")
