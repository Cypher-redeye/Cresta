"""
Vectorized Backtesting Engine for Cresta.

Simulates historical trading using technical signals (RSI, MACD, SMA, Bollinger)
as a proxy for the Ensemble model's BUY/SELL/HOLD decisions.

Architecture:
  1. Fetches 1-2 years of OHLCV via SafeDataFetcher
  2. Generates vectorized signals with 1-day execution lag
  3. Simulates portfolio with friction (brokerage + slippage)
  4. Computes Sharpe, MDD, CAGR, and benchmark comparison

All core loops are replaced with NumPy/Pandas vectorised operations.
"""
import numpy as np
import pandas as pd
import time
import logging

from .data_loader import SafeDataFetcher
from .features import compute_rsi, compute_macd, compute_bollinger

logger = logging.getLogger(__name__)

# ──────────────────────────────────────────────
#  Constants
# ──────────────────────────────────────────────
RISK_POSITION_SIZE = {
    "Aggressive": 0.20,
    "Moderate": 0.10,
    "Conservative": 0.05,
}

BROKERAGE_PCT = 0.0005   # 0.05%
SLIPPAGE_PCT  = 0.001    # 0.10%
RISK_FREE_RATE = 0.06    # 6% annualised
TRADING_DAYS   = 252


# ──────────────────────────────────────────────
#  Signal Generation (fully vectorised)
# ──────────────────────────────────────────────
def generate_signals(ticker: str, df: pd.DataFrame) -> pd.Series:
    """
    Generate BUY (+1) / SELL (-1) / HOLD (0) signals from pre-computed DB.
    """
import functools
import os

@functools.lru_cache(maxsize=1)
def _load_signals_dataframe():
    """Load signals CSV into memory once per worker process."""
    signals_file = os.path.join(os.path.dirname(__file__), "..", "signals.csv")
    if not os.path.exists(signals_file):
        logger.warning(f"No pre-computed signals file found at {signals_file}. Defaulting to HOLD.")
        return None
    try:
        return pd.read_csv(signals_file)
    except Exception as e:
        logger.error(f"Error loading pre-computed signals: {e}")
        return None


def generate_signals(ticker: str, df: pd.DataFrame) -> pd.Series:
    """
    Generate BUY (+1) / SELL (-1) / HOLD (0) signals from pre-computed DB.
    """
    BUY_THRESHOLD = float(os.getenv("BUY_THRESHOLD", 0.01))
    SELL_THRESHOLD = float(os.getenv("SELL_THRESHOLD", -0.01))
    
    signal = pd.Series(0, index=df.index, dtype=np.int8)
    
    try:
        sig_df = _load_signals_dataframe()
        if sig_df is None:
            return signal
        # Filter for this ticker
        sig_df = sig_df[sig_df['ticker'] == ticker].copy()
        if sig_df.empty:
            return signal
            
        sig_df['date_str'] = pd.to_datetime(sig_df['date']).dt.strftime('%Y-%m-%d')
        sig_df.set_index('date_str', inplace=True)
        
        df_dates = df.index.strftime('%Y-%m-%d')
        
        # Align with the market data dates
        aligned = sig_df.reindex(df_dates)
        
        # Apply threshold rules
        pred_return = aligned['predicted_return']
        lower_bound = aligned['lower_bound_return']
        
        # Buy if expected return exceeds threshold AND lower confidence bound isn't catastrophic
        buy_mask = (pred_return > BUY_THRESHOLD) & (lower_bound > -0.01)
        # Sell if expected return falls below threshold
        sell_mask = (pred_return < SELL_THRESHOLD)
        
        signal[buy_mask.fillna(False).values] = 1
        signal[sell_mask.fillna(False).values] = -1
        
    except Exception as e:
        logger.error(f"Error loading pre-computed signals: {e}")
        
    return signal


# ──────────────────────────────────────────────
#  Core Backtester
# ──────────────────────────────────────────────
class Backtester:
    """
    Vectorised portfolio simulator.

    Parameters
    ----------
    ticker : str          e.g. "RELIANCE.NS"
    risk_profile : str    "Conservative" | "Moderate" | "Aggressive"
    initial_capital : float
    period : str          yfinance period string, e.g. "1y", "2y"
    """

    def __init__(
        self,
        ticker: str,
        risk_profile: str = "Moderate",
        initial_capital: float = 100_000.0,
        period: str = "1y",
    ):
        self.ticker = ticker
        self.risk_profile = risk_profile
        self.initial_capital = initial_capital
        self.period = period
        self.position_frac = RISK_POSITION_SIZE.get(risk_profile, 0.10)
        self.friction = BROKERAGE_PCT + SLIPPAGE_PCT  # combined per-trade %

    # ── public entry ─────────────────────────
    def run(self) -> dict:
        """Execute full backtest and return result dict."""
        t0 = time.time()

        # 1. Fetch data
        df = self._fetch_data()

        # 2. Raw signals (no lag)
        raw_signal = generate_signals(self.ticker, df)

        # 3. Apply 1-day execution lag
        #    Signal generated at close of day T → executed at open of day T+1
        lagged_signal = raw_signal.shift(1).fillna(0).astype(np.int8)

        # 4. Vectorised portfolio simulation
        equity_curve, trades = self._simulate(df, lagged_signal)

        # 5. Benchmark: Nifty 50 buy-and-hold
        benchmark_curve = self._benchmark(df)

        # 6. Performance stats
        stats = self._compute_stats(equity_curve, benchmark_curve, trades, df)
        stats["elapsed_seconds"] = round(time.time() - t0, 2)

        # 7. Build response
        dates = [d.strftime("%Y-%m-%d") for d in df.index]
        return {
            "ticker": self.ticker,
            "period": self.period,
            "risk_profile": self.risk_profile,
            "initial_capital": self.initial_capital,
            "equity_curve": np.round(equity_curve, 2).tolist(),
            "benchmark_curve": np.round(benchmark_curve, 2).tolist(),
            "dates": dates,
            "trades": trades,
            "stats": stats,
        }

    # ── data ─────────────────────────────────
    def _fetch_data(self) -> pd.DataFrame:
        if self.period == "1mo":
            min_days = 15
        elif self.period == "3mo":
            min_days = 45
        elif self.period == "1y":
            min_days = 60
        else:
            min_days = 120
        return SafeDataFetcher.fetch_ticker_data(
            self.ticker, period=self.period, min_days=min_days
        )

    # ── simulation (vectorised) ──────────────
    def _simulate(
        self, df: pd.DataFrame, signal: pd.Series
    ) -> tuple[np.ndarray, list]:
        """
        Vectorised single-asset portfolio sim.

        For each day:
          • If signal == +1 and no position → BUY at Open * (1 + friction)
          • If signal == -1 and has position → SELL at Open * (1 - friction)
          • Otherwise → hold, equity = cash + position_value

        Returns (equity_curve_array, trade_log_list).
        """
        n = len(df)
        opens  = df["Open"].values.astype(np.float64)
        closes = df["Close"].values.astype(np.float64)
        sig    = signal.values

        cash     = np.empty(n, dtype=np.float64)
        holdings = np.empty(n, dtype=np.float64)   # number of shares
        equity   = np.empty(n, dtype=np.float64)

        cash[0]     = self.initial_capital
        holdings[0] = 0.0
        equity[0]   = self.initial_capital

        trades: list[dict] = []

        for i in range(1, n):
            c = cash[i - 1]
            h = holdings[i - 1]

            if sig[i] == 1 and h == 0:
                # BUY — use position_frac of current equity
                alloc = c * self.position_frac
                exec_price = opens[i] * (1 + self.friction)
                qty = int(alloc // exec_price) if exec_price > 0 else 0
                if qty > 0:
                    cost = qty * exec_price
                    c -= cost
                    h += qty
                    trades.append({
                        "date": df.index[i].strftime("%Y-%m-%d"),
                        "action": "BUY",
                        "price": round(float(opens[i]), 2),
                        "exec_price": round(float(exec_price), 2),
                        "qty": qty,
                        "cost": round(float(cost), 2),
                    })

            elif sig[i] == -1 and h > 0:
                # SELL entire position
                exec_price = opens[i] * (1 - self.friction)
                revenue = h * exec_price
                trades.append({
                    "date": df.index[i].strftime("%Y-%m-%d"),
                    "action": "SELL",
                    "price": round(float(opens[i]), 2),
                    "exec_price": round(float(exec_price), 2),
                    "qty": int(h),
                    "revenue": round(float(revenue), 2),
                })
                c += revenue
                h = 0.0

            cash[i]     = c
            holdings[i] = h
            equity[i]   = c + h * closes[i]

        return equity, trades

    # ── benchmark (Nifty 50 buy-and-hold) ────
    def _benchmark(self, df: pd.DataFrame) -> np.ndarray:
        """
        Nifty 50 Buy-and-Hold benchmark scaled to initial_capital.
        Falls back to the ticker's own buy-and-hold if Nifty data is unavailable.
        """
        try:
            nifty = SafeDataFetcher.fetch_ticker_data(
                "^NSEI", period=self.period, min_days=30
            )
            # Align to backtest dates
            nifty_close = nifty["Close"].reindex(df.index).ffill().bfill().values
        except Exception:
            # Fallback: use the ticker itself as benchmark
            nifty_close = df["Close"].values.copy()

        if nifty_close[0] == 0:
            nifty_close[0] = 1.0  # prevent div-by-zero

        return self.initial_capital * (nifty_close / nifty_close[0])

    # ── stats ────────────────────────────────
    def _compute_stats(
        self,
        equity: np.ndarray,
        benchmark: np.ndarray,
        trades: list,
        df: pd.DataFrame,
    ) -> dict:
        total_return = (equity[-1] / equity[0]) - 1
        n_days = len(equity)
        years = n_days / TRADING_DAYS

        # CAGR
        cagr = (equity[-1] / equity[0]) ** (1 / max(years, 0.01)) - 1

        # Daily returns → Sharpe
        daily_ret = np.diff(equity) / equity[:-1]
        daily_ret = daily_ret[np.isfinite(daily_ret)]
        excess = daily_ret - (RISK_FREE_RATE / TRADING_DAYS)
        sharpe = (
            (np.mean(excess) / (np.std(excess) + 1e-10)) * np.sqrt(TRADING_DAYS)
            if len(excess) > 1
            else 0.0
        )

        # Max Drawdown
        peak = np.maximum.accumulate(equity)
        drawdown = (equity - peak) / (peak + 1e-10)
        max_dd = float(np.min(drawdown))

        # Win rate & profit factor
        buy_prices: list[float] = []
        wins, losses = 0, 0
        gross_profit, gross_loss = 0.0, 0.0

        for t in trades:
            if t["action"] == "BUY":
                buy_prices.append(t["exec_price"])
            elif t["action"] == "SELL" and buy_prices:
                buy_p = buy_prices.pop(0)
                pnl = (t["exec_price"] - buy_p) * t["qty"]
                if pnl >= 0:
                    wins += 1
                    gross_profit += pnl
                else:
                    losses += 1
                    gross_loss += abs(pnl)

        total_trades = wins + losses
        win_rate = (wins / total_trades * 100) if total_trades > 0 else 0.0
        profit_factor = (
            gross_profit / (gross_loss + 1e-10) if gross_loss > 0 else 0.0
        )

        # Benchmark return
        bench_return = (benchmark[-1] / benchmark[0]) - 1

        return {
            "total_return_pct": round(float(total_return * 100), 2) if np.isfinite(total_return) else 0.0,
            "cagr_pct": round(float(cagr * 100), 2) if np.isfinite(cagr) else 0.0,
            "sharpe_ratio": round(float(sharpe), 2) if np.isfinite(sharpe) else 0.0,
            "max_drawdown_pct": round(float(max_dd * 100), 2) if np.isfinite(max_dd) else 0.0,
            "total_trades": len(trades),
            "winning_trades": wins,
            "losing_trades": losses,
            "win_rate_pct": round(float(win_rate), 1) if np.isfinite(win_rate) else 0.0,
            "profit_factor": round(float(profit_factor), 2) if np.isfinite(profit_factor) else 0.0,
            "benchmark_return_pct": round(float(bench_return * 100), 2) if np.isfinite(bench_return) else 0.0,
            "final_equity": round(float(equity[-1]), 2) if np.isfinite(equity[-1]) else float(equity[0]),
        }


# ──────────────────────────────────────────────
#  Multi-Ticker Portfolio Backtest
# ──────────────────────────────────────────────
def backtest_portfolio(
    tickers: list[str],
    risk_profile: str = "Moderate",
    initial_capital: float = 100_000.0,
    period: str = "1y",
) -> dict:
    """
    Run backtest across multiple tickers with equal capital allocation.
    Returns aggregated equity curve and per-ticker breakdown.
    """
    n = len(tickers)
    per_ticker_capital = initial_capital / max(n, 1)

    results = []
    combined_equity = None
    combined_dates = None

    for ticker in tickers:
        try:
            bt = Backtester(ticker, risk_profile, per_ticker_capital, period)
            res = bt.run()
            results.append(res)

            eq = np.array(res["equity_curve"])
            if combined_equity is None:
                combined_equity = eq.copy()
                combined_dates = res["dates"]
            else:
                # Align lengths (trim to shorter)
                min_len = min(len(combined_equity), len(eq))
                combined_equity = combined_equity[:min_len] + eq[:min_len]
        except Exception as e:
            logger.warning(f"Backtest skipped for {ticker}: {e}")
            continue

    if combined_equity is None:
        raise ValueError("All tickers failed during backtest.")

    # Aggregate stats
    total_return = (combined_equity[-1] / initial_capital) - 1
    n_days = len(combined_equity)
    years = n_days / TRADING_DAYS
    cagr = (combined_equity[-1] / initial_capital) ** (1 / max(years, 0.01)) - 1

    daily_ret = np.diff(combined_equity) / combined_equity[:-1]
    daily_ret = daily_ret[np.isfinite(daily_ret)]
    excess = daily_ret - (RISK_FREE_RATE / TRADING_DAYS)
    sharpe = (
        (np.mean(excess) / (np.std(excess) + 1e-10)) * np.sqrt(TRADING_DAYS)
        if len(excess) > 1
        else 0.0
    )

    peak = np.maximum.accumulate(combined_equity)
    drawdown = (combined_equity - peak) / (peak + 1e-10)
    max_dd = float(np.min(drawdown))

    return {
        "tickers": tickers,
        "risk_profile": risk_profile,
        "initial_capital": initial_capital,
        "period": period,
        "equity_curve": np.round(combined_equity, 2).tolist(),
        "dates": combined_dates,
        "per_ticker": [
            {"ticker": r["ticker"], "stats": r["stats"]} for r in results
        ],
        "aggregate_stats": {
            "total_return_pct": round(float(total_return * 100), 2),
            "cagr_pct": round(float(cagr * 100), 2),
            "sharpe_ratio": round(float(sharpe), 2),
            "max_drawdown_pct": round(float(max_dd * 100), 2),
            "tickers_succeeded": len(results),
            "tickers_failed": len(tickers) - len(results),
            "final_equity": round(float(combined_equity[-1]), 2),
        },
    }


# ──────────────────────────────────────────────
#  CLI smoke test
# ──────────────────────────────────────────────
if __name__ == "__main__":
    print("─── Single-Ticker Backtest ───")
    bt = Backtester("RELIANCE.NS", risk_profile="Moderate", period="1y")
    res = bt.run()
    print(f"Ticker: {res['ticker']}")
    print(f"Period: {res['period']}")
    print(f"Trades: {res['stats']['total_trades']}")
    print(f"Return: {res['stats']['total_return_pct']}%")
    print(f"Sharpe: {res['stats']['sharpe_ratio']}")
    print(f"MDD:    {res['stats']['max_drawdown_pct']}%")
    print(f"CAGR:   {res['stats']['cagr_pct']}%")
    print(f"Benchmark: {res['stats']['benchmark_return_pct']}%")
    print(f"Elapsed: {res['stats'].get('elapsed_seconds', '?')}s")
