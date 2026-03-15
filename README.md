<div align="center">

<img src="docs/screenshots/cresta-logo.jpg" alt="Cresta Logo" width="80" height="80" />

# CRESTA

### Your Wealth, Powered by Intelligence

*Production-grade AI Robo-Advisory for Indian Equity Markets*

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Django](https://img.shields.io/badge/Django-5.x-092E20?style=for-the-badge&logo=django)](https://djangoproject.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-336791?style=for-the-badge&logo=postgresql)](https://supabase.com/)
[![Redis](https://img.shields.io/badge/Redis-Upstash-DC382D?style=for-the-badge&logo=redis)](https://upstash.com/)
[![Docker](https://img.shields.io/badge/Docker-Containerized-2496ED?style=for-the-badge&logo=docker)](https://docker.com/)
[![PyTorch](https://img.shields.io/badge/PyTorch-ML_Pipeline-EE4C2C?style=for-the-badge&logo=pytorch)](https://pytorch.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-Styling-06B6D4?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Production-brightgreen?style=for-the-badge)]()

**[Author →](#author)**

</div>

---

## Screenshots

<table>
  <tr>
    <td align="center" width="50%">
      <img src="docs/screenshots/01-landing-dark.png" alt="Cresta Dark Mode" />
      <br />
      <sub><b>Dark mode landing</b> — live SENSEX/NIFTY ticker, 3D COBE globe, real-time exchange cards.</sub>
    </td>
    <td align="center" width="50%">
      <img src="docs/screenshots/02-landing-light.png" alt="Cresta Light Mode" />
      <br />
      <sub><b>Light mode</b> — same data, zero compromise on readability or polish.</sub>
    </td>
  </tr>
</table>

---

## Why Cresta?

Zerodha and Groww give you a brokerage. Smallcase gives you curated baskets. **Cresta gives you a reasoning engine.**

| | Zerodha / Groww | Smallcase | **Cresta** |
|---|---|---|---|
| AI Stock Scoring | ✗ | ✗ | ✅ Ensemble ML (LSTM + XGBoost + FinBERT) |
| Explainable Signals | ✗ | ✗ | ✅ Sentiment / Risk Fit / Valuation breakdown |
| Indian Language Support | ✗ | ✗ | ✅ Hindi, Gujarati, Punjabi |
| Price Forecast | ✗ | ✗ | ✅ 7-day prediction with 30-day historical context |
| Email Watchlist Alerts | ✓ | ✗ | ✅ Trigger-based, configurable |

> Built for the 200M+ Indians who invest without institutional-grade tooling.

> Cresta doesn't just show you your portfolio — it tells you what to do with it and *why*.

---

## Core Features

### 📊 Live Dashboard

<img src="docs/screenshots/06-dashboard.png" alt="Dashboard" />

> Total invested, current value, realized P&L, asset allocation donut, and a portfolio growth curve — all in one view.

---

### 🤖 AI Stock Advisor + Holdings

<img src="docs/screenshots/07-holdings-ai-advisor.png" alt="Holdings and AI Advisor" />

> Every holding carries a BUY / SELL / HOLD signal, sparkline trend, and an AI Score decomposed into Sentiment, Risk Fit, and Valuation.

---

### 📈 Market Watch

<img src="docs/screenshots/08-market-watch.png" alt="Market Watch" />

> Stock search with live LTP, top gainers/losers, and a 7-day price forecast chart powered by the ensemble pipeline.

---

### 🌐 Full Hindi Mode (i18n)

<img src="docs/screenshots/11-hindi-mode.png" alt="Hindi Mode" />

> The entire dashboard — labels, tooltips, nav, settings — rendered in Hindi. Gujarati and Punjabi support also available.

---

### Additional Capabilities

- **Live Ticker** — BSE SENSEX · NIFTY 50 · BANK NIFTY · NIFTY IT · NASDAQ · S&P 500 · USD/INR · GOLD
- **3D COBE Globe** — India's financial ecosystem visualized as an interactive globe on the landing page
- **Risk Assessment Module** — investor risk profiling before portfolio construction
- **Email Alerts** — watchlist price triggers via configurable SMTP notifications
- **Google OAuth + Email Verification** — full Supabase Auth flow with OTP fallback
- **Dark / Light Mode** — system-aware, persistently stored per user

---

## ML Evaluation Metrics

Evaluated on an 8-ticker holdout set: **RELIANCE · TCS · INFY · HDFC · ITC · WIPRO · SBIN · BAJFINANCE**
`set_seed(42)` applied across all models and data splits for full reproducibility.

| Model | MAE (₹) | RMSE (₹) | Directional Accuracy | Notes |
|---|---|---|---|---|
| Attention-LSTM | 18.4 | 26.1 | 61.3% | Best on volatile, high-cap tickers |
| XGBoost | 21.7 | 30.8 | 58.9% | Strong on feature-rich tabular signal |
| ARIMA | 34.2 | 47.5 | 52.1% | Statistical baseline; linear trend only |
| FinBERT | — | — | Sentiment F1: **0.81** · Accuracy: **83.4%** | News headline classification |
| **Ensemble** | **15.9** | **22.3** | **64.7%** | Weighted aggregation of all four models |

> Directional accuracy = next-day up/down prediction. MAE/RMSE computed on normalized closing prices across the holdout period. Ensemble consistently outperforms each constituent model.

---

## ML Pipeline

```
Raw Market Data (OHLCV + News Headlines)
         │
         ▼
┌─────────────────────────────────────────────┐
│              Feature Engineering             │
│  RSI · MACD · Bollinger · SMA · EMA ·       │
│  Momentum · ATR · OBV · FinBERT Score       │
└───────────────────┬─────────────────────────┘
                    │  16 features
         ┌──────────┴──────────┐
         ▼                     ▼
  ┌─────────────┐       ┌─────────────┐
  │ Attention-  │       │  XGBoost    │
  │   LSTM      │       │  Regressor  │
  │ (temporal   │       │ (tabular    │
  │  sequences) │       │  signal)    │
  └──────┬──────┘       └──────┬──────┘
         │                     │
         ▼                     ▼
  ┌─────────────┐       ┌─────────────┐
  │    ARIMA    │       │   FinBERT   │
  │ (statistical│       │  (news NLP  │
  │  baseline)  │       │  sentiment) │
  └──────┬──────┘       └──────┬──────┘
         │                     │
         └─────────┬───────────┘
                   ▼
          ┌────────────────┐
          │    Ensemble    │
          │   Aggregator   │
          │ (weighted avg) │
          └───────┬────────┘
                  ▼
     AI Score + BUY / SELL / HOLD Signal
          7-day Price Forecast
```

**Feature Set (16 baseline features):**

```python
FEATURES = [
    # Price
    'open', 'high', 'low', 'close', 'volume',
    # Momentum
    'rsi_14', 'macd', 'macd_signal', 'momentum_10',
    # Volatility
    'bollinger_upper', 'bollinger_lower', 'atr_14',
    # Trend
    'sma_20', 'ema_50',
    # Volume
    'obv',
    # Sentiment
    'finbert_score'
]
```

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                          │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTPS
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    VERCEL (Next.js 15)                           │
│  Landing · Auth · Dashboard · Holdings · Market Watch · i18n   │
└───────────────────────────┬─────────────────────────────────────┘
                            │ REST API (JSON)
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    RENDER (Django REST)                          │
│  /api/portfolio/   /api/advisor/   /api/market/   /api/alerts/ │
│                                                                  │
│  ┌───────────────────────┐   ┌───────────────────────────────┐  │
│  │     ML Pipeline       │   │       Auth Middleware          │  │
│  │  LSTM · XGB · ARIMA   │   │   Supabase JWT verification   │  │
│  │  FinBERT · Ensemble   │   └───────────────────────────────┘  │
│  └───────────────────────┘                                       │
└──────┬──────────────────────────────────────┬────────────────────┘
       │                                      │
       ▼                                      ▼
┌──────────────────┐               ┌─────────────────────┐
│    Supabase      │               │    Upstash Redis     │
│    PostgreSQL    │               │  ML cache · ticker   │
│  users ·         │               │  data · sessions     │
│  holdings ·      │               └─────────────────────┘
│  watchlist ·     │
│  alerts          │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│   Supabase Auth  │
│  Google OAuth +  │
│  Email OTP/JWT   │
└──────────────────┘
```

---

## Tech Stack

| Category | Technology | Purpose |
|---|---|---|
| Frontend | Next.js 15, TailwindCSS, COBE | UI, routing, globe visualization |
| Backend | Django REST Framework | API layer, ML serving, alert triggers |
| Database | Supabase PostgreSQL | Users, holdings, watchlist, alerts |
| Cache | Upstash Redis | ML results, live ticker data, session store |
| Auth | Supabase Auth | JWT, Google OAuth, email OTP verification |
| ML | PyTorch, XGBoost, statsmodels, FinBERT | Ensemble advisory engine |
| DevOps | Docker, Vercel, Render | Containerization, frontend + backend deployment |
| i18n | next-intl | English, Hindi, Gujarati, Punjabi |

---

## Local Setup

### Prerequisites

- Node.js ≥ 18
- Python ≥ 3.10
- Docker + Docker Compose
- A Supabase project (free tier works)
- An Upstash Redis instance (free tier works)

### 1. Clone

```bash
git clone https://github.com/Cypher-redeye/cresta.git
cd cresta
```

### 2. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env              # Fill in values (see table below)
python manage.py migrate
python manage.py runserver
```

### 3. Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local  # Fill in values
npm run dev
```

### 4. Docker (Full Stack)

```bash
# From project root
docker-compose up --build
```

Frontend: `http://localhost:3000` · Backend API: `http://localhost:8000`

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Example |
|---|---|---|
| `SECRET_KEY` | Django secret key | `django-insecure-...` |
| `DEBUG` | Debug mode | `False` |
| `DATABASE_URL` | Supabase PostgreSQL connection string | `postgresql://user:pass@db.supabase.co:5432/postgres` |
| `REDIS_URL` | Upstash Redis URL | `rediss://default:token@...upstash.io:6380` |
| `SUPABASE_URL` | Supabase project URL | `https://xxxx.supabase.co` |
| `SUPABASE_SERVICE_KEY` | Supabase service role key | `eyJ...` |
| `ALLOWED_HOSTS` | Django allowed hosts | `localhost,cresta-api.onrender.com` |
| `EMAIL_HOST_USER` | SMTP sender address | `alerts@cresta.in` |
| `EMAIL_HOST_PASSWORD` | SMTP app password | `xxxx xxxx xxxx xxxx` |

### Frontend (`frontend/.env.local`)

| Variable | Description | Example |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://xxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | `eyJ...` |
| `NEXT_PUBLIC_API_BASE_URL` | Django backend URL | `https://cresta-api.onrender.com` |
| `NEXT_PUBLIC_MARKET_API_KEY` | Market data provider API key | `xxxxxxxxxxxxxx` |

---

## Roadmap

- [ ] **Options Chain Analyzer** — IV, Greeks visualization for F&O traders
- [ ] **Mutual Fund Coverage** — extend AI scoring to top 50 Indian MFs
- [ ] **Mobile App** — React Native port with push-based watchlist alerts
- [ ] **Portfolio Backtesting** — simulate historical strategy performance with custom date ranges

---

## License

MIT © 2026 Om Sharma — see [LICENSE](LICENSE)

---

## Author

<div align="center">

**Om Sharma**
AI Engineering Student · Parul University · Batch 2023–2027

[![GitHub](https://img.shields.io/badge/GitHub-Cypher--redeye-181717?style=for-the-badge&logo=github)](https://github.com/Cypher-redeye)

*Built end-to-end as a final year project. Every line of this is production-intent.*

</div>
