import sys
import os
import matplotlib.pyplot as plt

# Add backend directory to sys.path so we can import from backend.recommender
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

try:
    from recommender.backtester import Backtester
except ImportError as e:
    print(f"Import error: {e}")
    sys.exit(1)

def generate_plot():
    ticker = "RELIANCE.NS"
    print(f"Running backtest for {ticker}...")
    bt = Backtester(ticker, risk_profile="Moderate", period="1y")
    res = bt.run()
    
    dates = res['dates']
    equity = res['equity_curve']
    benchmark = res['benchmark_curve']
    
    # Plotting
    plt.figure(figsize=(10, 6))
    plt.plot(dates, equity, label="Strategy Equity", color='blue', linewidth=2)
    plt.plot(dates, benchmark, label="Benchmark (Nifty 50)", color='gray', linestyle='--')
    
    plt.title(f"Backtest Performance: {ticker} (1y)")
    plt.xlabel("Date")
    plt.ylabel("Portfolio Value (INR)")
    
    # Reduce x-axis ticks to avoid clutter
    plt.xticks(ticks=range(0, len(dates), len(dates)//10), labels=[dates[i] for i in range(0, len(dates), len(dates)//10)], rotation=45)
    
    plt.legend()
    plt.grid(True, alpha=0.3)
    plt.tight_layout()
    
    out_file = os.path.join(os.path.dirname(__file__), "backtest_plot.png")
    plt.savefig(out_file, dpi=300)
    print(f"Plot saved to {out_file}")

if __name__ == "__main__":
    generate_plot()
