<div align="center">

<img src="frontend/public/favicon.svg" width="60" height="60" alt="Cresta Logo" />

# CRESTA

### Your Wealth, Powered by Intelligence

*Production-grade AI Robo-Advisory for Indian Equity Markets*

[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![Django](https://img.shields.io/badge/Django-5.x-092E20?style=for-the-badge&logo=django)](https://djangoproject.com/)
[![PyTorch](https://img.shields.io/badge/PyTorch-ML_Pipeline-EE4C2C?style=for-the-badge&logo=pytorch)](https://pytorch.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-336791?style=for-the-badge&logo=postgresql)](https://postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-Cache-DC382D?style=for-the-badge&logo=redis)](https://redis.io/)
[![Docker](https://img.shields.io/badge/Docker-Containerized-2496ED?style=for-the-badge&logo=docker)](https://docker.com/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Pre--Deployment-orange?style=for-the-badge)]()

**[Live Demo →](https://crestafinance.me)** · **[Author →](#author)**

</div>

---

## Screenshots

<table>
  <tr>
    <td align="center" width="50%">
      <img src="docs/screenshots/01-landing-dark.png" alt="Dark Mode Landing" width="100%" />
      <br /><sub><b>Dark Mode Landing</b> — live SENSEX/NIFTY ticker, 3D COBE globe, breathing emerald gradient, floating market data.</sub>
    </td>
    <td align="center" width="50%">
      <img src="docs/screenshots/02-landing-light.png" alt="Light Mode Landing" width="100%" />
      <br /><sub><b>Light Mode Landing</b> — same data, zero compromise on readability. Globe adapts palette automatically.</sub>
    </td>
  </tr>
  <tr>
    <td align="center" width="50%">
      <img src="docs/screenshots/03-features.png" alt="Intelligent Features" width="100%" />
      <br /><sub><b>Intelligent Features</b> — AI Risk Profiling, Real-time Market Data, Automated Rebalancing cards.</sub>
    </td>
    <td align="center" width="50%">
      <img src="docs/screenshots/04-login.png" alt="Login Page" width="100%" />
      <br /><sub><b>Login Page</b> — Warren Buffett quote, Google OAuth, JWT authentication, sign up flow.</sub>
    </td>
  </tr>
  <tr>
    <td align="center" width="50%">
      <img src="docs/screenshots/05-email-verify.png" alt="Email Verification" width="100%" />
      <br /><sub><b>Email Verification</b> — token-based verification for all new signups, 24-hour expiry.</sub>
    </td>
    <td align="center" width="50%">
      <img src="docs/screenshots/06-dashboard.png" alt="Portfolio Dashboard" width="100%" />
      <br /><sub><b>Portfolio Dashboard</b> — total invested, current value, P&L, asset allocation donut, live ticker tape, AI alerts.</sub>
    </td>
  </tr>
  <tr>
    <td align="center" width="50%">
      <img src="docs/screenshots/07-holdings-ai-advisor.png" alt="Holdings and AI Advisor" width="100%" />
      <br /><sub><b>Holdings + AI Advisor</b> — sparkline trends, BUY/SELL/HOLD signals, AI Score breakdown (Sentiment/Risk Fit/Valuation), personalized news.</sub>
    </td>
    <td align="center" width="50%">
      <img src="docs/screenshots/08-market-watch.png" alt="Market Watch" width="100%" />
      <br /><sub><b>Market Watch</b> — stock search, 30-day historical + 7-day AI forecast, dynamic red/green coloring, NIFTY/SENSEX/BANK NIFTY indices.</sub>
    </td>
  </tr>
  <tr>
    <td align="center" width="50%">
      <img src="docs/screenshots/09-market-news.png" alt="Personalized News" width="100%" />
      <br /><sub><b>Personalized News Feed</b> — top gainers/losers, Reuters/Bloomberg headlines filtered by portfolio holdings.</sub>
    </td>
    <td align="center" width="50%">
      <img src="docs/screenshots/10-settings.png" alt="Settings" width="100%" />
      <br /><sub><b>Settings</b> — profile management, dark/light mode toggle, language selection (English, Hindi, Gujarati, Punjabi).</sub>
    </td>
  </tr>
  <tr>
    <td align="center" width="50%">
      <img src="docs/screenshots/11-hindi-mode.png" alt="Hindi Mode" width="100%" />
      <br /><sub><b>Full Hindi Mode</b> — entire dashboard rendered in Hindi including nav, tooltips, AI reasoning, holdings table, and alerts.</sub>
    </td>
    <td align="center" width="50%">
      <img src="docs/screenshots/12-backtest.png" alt="Portfolio Backtesting" width="100%" />
      <br /><sub><b>Portfolio Backtesting</b> — simulate historical strategy vs Nifty50 benchmark.</sub>
    </td>
  </tr>
  <tr>
    <td align="center" width="50%">
      <img src="docs/screenshots/13-backtest-results.png" alt="Backtest Results" width="100%" />
      <br /><sub><b>Backtest Results</b> — detailed metrics including Sharpe ratio, drawdown, and CAGR.</sub>
    </td>
    <td align="center" width="50%">
      <img src="docs/screenshots/14-risk-assement.png" alt="Risk Assessment" width="100%" />
      <br /><sub><b>Intelligent Risk Profiling</b> — dynamic classification based on XGBoost profiling.</sub>
    </td>
  </tr>
</table>

---

## Why Cresta?

Zerodha and Groww give you a brokerage. Smallcase gives you curated baskets. **Cresta gives you a reasoning engine.**

| | Zerodha / Groww | Smallcase | Wealthfront | **Cresta** |
|---|---|---|---|---|
| AI Stock Scoring | ✗ | ✗ | Partial | ✅ Ensemble ML (LSTM + XGBoost + ARIMA + FinBERT) |
| Explainable Signals | ✗ | ✗ | ✗ | ✅ Sentiment / Risk Fit / Valuation breakdown |
| Indian Language Support | ✗ | ✗ | ✗ | ✅ Hindi, Gujarati & Punjabi |
| 7-day Price Forecast | ✗ | ✗ | ✗ | ✅ Walk-forward validated ensemble |
| Email Watchlist Alerts | ✓ | ✗ | ✓ | ✅ Trigger-based, configurable |
| Risk Profiling (ML) | ✗ | ✗ | ✓ | ✅ XGBoost + NFCS 2021 real survey data |
| Email Verification | ✗ | ✗ | ✓ | ✅ Token-based, 24-hour expiry |

> Built for the 200M+ Indians who invest without institutional-grade tooling.

---

## 📊 ML Evaluation Metrics

### 1. 🧠 Intelligent Risk Profiling

Cresta dynamically classifies users as **Conservative, Moderate, or Aggressive** based on Age, Income, Investment Goals, and Risk Tolerance.

* **Model:** XGBoost Classifier
* **Dataset:** 25,000 profiles — 2,578 real NFCS 2021 Investor Survey respondents (FINRA Foundation) augmented with 22,422 synthetic profiles generated via SEBI income capacity guideline distributions and empirical behavioral noise.
* **Accuracy:** 84% (5-Fold Stratified Cross-Validation)
* **Conservative Recall:** 84% — critical for fiduciary safety

**Explainable AI (XAI) — Feature Importance:**

| Feature | Importance |
|---|---|
| Risk Tolerance | 61.35% |
| Income | 17.81% |
| Investment Goal | 14.75% |
| Age | 3.88% |
| Experience | 2.21% |

---

### 2. 📈 Tier-2 Quant Stock Forecasting

* **Architecture:** Attention-LSTM Hybrid + XGBoost + ARIMA Ensemble
* **Attention Mechanism:** Applies learned temporal weights across LSTM hidden states, allowing the model to selectively focus on the most predictive time steps rather than treating all historical observations equally.
* **Ensemble Weights:** (0.70 LSTM / 0.10 XGBoost / 0.20 ARIMA) selected via validation MAPE minimization across walk-forward folds — LSTM dominates long-horizon trend capture while ARIMA stabilizes short-term variance.
* **Features (16):** Close, Volume, SMA (5, 20), RSI (14), MACD, Bollinger Bands, OBV, FinBERT Sentiment (daily NSE-listed company headlines via yfinance news API, aggregated as mean sentiment score per ticker across all articles published within 24 hours), USD/INR Exchange Rate, India VIX, Crude Oil Futures
* **Validation:** Strict Walk-Forward Validation (3-fold expanding window, minimum 45-day folds) — no look-ahead bias
* **Seed:** Fixed at 42 for full reproducibility
* **Dataset:** 20 years of historical Nifty50 daily data (via Kaggle & `yfinance`)

**Forecasting Performance (Walk-Forward Validated):**

| Ticker | Sector | Directional Accuracy | MAPE |
|---|---|---|---|
| RELIANCE.NS | Energy/Conglomerate | 85.2% | 10.84% |
| ICICIBANK.NS | Banking | 70.4% | 6.75% |
| HDFCBANK.NS | Banking | 72.6% | 7.01% |
| MARUTI.NS | Auto | 70.4% | 17.38% |
| ONGC.NS | Energy | 78.5% | 12.73% |
| TCS.NS | IT Services | 68.9% | 9.83% |
| SUNPHARMA.NS | Pharma | 60.7% | 5.98% |
| INFY.NS | IT Services | 54.1%* | 10.66% |

*\*Data-limited — insufficient 20-year historical coverage. System suppresses recommendations and serves data-limitation warning for stocks below 60% directional accuracy threshold.*

**Average directional accuracy across 7 liquid stocks: 72.3%**

---

## ML Pipeline

```
Raw Market Data (OHLCV + News Headlines)
         │
         ▼
┌─────────────────────────────────────────────┐
│              Feature Engineering             │
│  RSI · MACD · Bollinger · SMA · OBV ·       │
│  India VIX · USD/INR · Crude · FinBERT      │
└───────────────────┬─────────────────────────┘
                    │  16 features
         ┌──────────┴──────────┐
         ▼                     ▼
  ┌─────────────┐       ┌─────────────┐
  │ Attention-  │       │  XGBoost    │
  │   LSTM      │       │  Regressor  │
  │ (temporal)  │       │ (tabular)   │
  └──────┬──────┘       └──────┬──────┘
         │                     │
         ▼                     ▼
  ┌─────────────┐       ┌─────────────┐
  │    ARIMA    │       │   FinBERT   │
  │ (baseline)  │       │  (NLP sent) │
  └──────┬──────┘       └──────┬──────┘
         └─────────┬───────────┘
                   ▼
          ┌────────────────┐
          │    Ensemble    │
          │  0.70/0.10/0.20│
          └───────┬────────┘
                  ▼
     AI Score + BUY / SELL / HOLD
          7-day Price Forecast
```

---

## 🏗️ System Architecture

```mermaid
graph TD
    Client[React + Vite Frontend] <-->|HTTPS / REST API| Nginx[Nginx Reverse Proxy]
    Nginx <-->|Gunicorn| Django[Django 5 Backend]
    Django <-->|Task Queue| Redis[Redis Broker]
    Redis <--> Celery[Celery Workers]
    Celery <-->|Train/Predict| PyTorch[Attention-LSTM Engine]
    Celery <-->|Analyze News| FinBERT[HuggingFace NLP]
    Django <-->|Classify Risk| XGBoost[XGBoost Profiler]
    Django <-->|AI Co-pilot| Gemini[Google Gemini 2.5]
    Django <--> Postgres[(PostgreSQL)]
    PyTorch <--> YF[yfinance API]
```

### 🗄️ Database Schema

```mermaid
erDiagram
    USER ||--o{ HOLDING : has
    USER ||--o{ TRANSACTION : executes
    USER ||--o{ WATCHLIST_ITEM : monitors
    USER ||--o{ WATCHLIST_ALERT : sets
    USER ||--o{ PAPER_TRADE : simulates
    
    USER {
        int id PK
        string email
        string password_hash
    }
    
    USER_PROFILE ||--|| USER : belongs_to
    USER_PROFILE {
        int id PK
        int age
        int income
        string investment_goal
        string risk_profile "Aggressive/Balanced/Conservative"
        int risk_score
        boolean email_verified
    }
    
    HOLDING {
        int id PK
        string ticker
        string name
        int qty
        float avg_price
        date purchase_date
    }

    TRANSACTION {
        int id PK
        string ticker
        string transaction_type "BUY/SELL"
        int qty
        float price
        float total_value
    }

    WATCHLIST_ITEM {
        int id PK
        string ticker
        string name
    }

    STOCK_PREDICTION {
        string ticker PK
        json history_array
        json future_forecast_array
        json metrics
        timestamp last_updated
    }
    
    PAPER_TRADE {
        int id PK
        string ticker
        string action "BUY/SELL"
        int quantity
        decimal price_at_trade
        timestamp created_at
    }
    
    WATCHLIST_ALERT {
        int id PK
        string ticker
        decimal target_price
        string condition "ABOVE/BELOW"
        boolean is_active
    }
```

---

## ✨ Core Features

### 🌍 Interactive 3D Global Exchange Globe
* **7 Global Exchanges:** BSE SENSEX, NSE NIFTY 50, FTSE 100, NYSE/DOW, IBOVESPA, NIKKEI 225, ASX 200
* **Geographic Sync:** Angular-distance phi detection ensures correct exchange card appears when that continent faces the camera
* **Live Data:** BSE SENSEX and NSE NIFTY 50 prices fetched live from backend API
* **Theme-Aware:** Globe adapts palette for Light and Dark mode via `ThemeContext`

### 🎨 Premium Emerald Design System
* **Dark Mode:** Deep charcoal `#121212` · **Light Mode:** Cool off-white `#f0f4f8`
* **Animated Background:** Canvas-based breathing gradient with 3 independent radial emerald glows + 45 floating market data numbers (SENSEX values, ₹ prices, ▲▼ indicators)
* **Complete cyan→emerald migration** across all components, Tailwind config, and CSS variables

### 🤖 Explainable AI (XAI) & Fiduciary Scoring
* **Sentiment (40 pts):** FinBERT NLP on daily NSE-listed company headlines
* **Risk Fit (40 pts):** Stock Beta matched against ML-classified user risk profile
* **Valuation (20 pts):** Price positioning relative to 52-week high/low
* Natural language reasoning generated per stock for full fiduciary transparency

### 📈 Performance-Driven Data Visualization
* Dynamic green/red chart coloring across all charts based on price direction
* Growth Forecast: historical line colored by trend, AI forecast in blue with confidence shading
* Portfolio chart, holdings sparklines, market indices all follow same logic

### 🔐 Security & Authentication
* JWT with 15-minute access tokens and HttpOnly refresh rotation
* **Email Verification:** Token-based verification for all new signups (24-hour expiry, SMTP delivery)
* Google OAuth integration
* Stock ticker inputs validated against NSE/BSE suffix whitelist
* Computational DoS mitigation via PostgreSQL prediction cache
* Production: `SECURE_SSL_REDIRECT`, `X-Frame-Options: DENY`, strict HSTS

### 🌐 Deep Localization (i18n)
* `react-i18next` supporting **English, Hindi, Gujarati, and Punjabi**
* All UI components, ML reasoning strings, and alerts translatable

### 📊 Portfolio Management
* Real-time P&L tracking via `yfinance`
* Smart Buy/Sell/Hold alerts based on moving average crossovers
* Email watchlist price trigger alerts via SMTP
* Paper trading and watchlist alert models
* Live ticker tape: SENSEX, NIFTY, BANK NIFTY, NIFTY IT, NASDAQ, S&P 500, USD/INR, GOLD

### 💬 AI Co-pilot & Chatbot
* Context-aware conversational AI powered by Google Gemini 2.5 Flash
* Uses LangChain with memory buffers for continuous dialogue
* Capable of real-time stock price lookup and personalized financial guidance
* Rate-limited and prompt-injection-protected backend

---

## 🛠️ Technology Stack

| Category | Technology | Purpose |
|---|---|---|
| Frontend | React 18, Vite, TailwindCSS, COBE | UI, routing, globe visualization |
| Backend | Django 5, DRF | API layer, ML serving, alert triggers |
| Database | PostgreSQL | Users, holdings, watchlist, alerts |
| Cache | Redis | ML results, live ticker data |
| Auth | JWT + Google OAuth | Authentication, email verification |
| ML | PyTorch, XGBoost, statsmodels, FinBERT | Ensemble advisory engine |
| GenAI | Gemini 2.5 Flash, LangChain | Conversational AI Co-pilot & context memory |
| MLOps | MLflow | CV loss curves, model versions, hyperparameters |
| DevOps | Docker, Nginx, Gunicorn | Containerization, production serving |
| i18n | react-i18next | English, Hindi, Gujarati, Punjabi |

---

## 🚀 Quick Start

### With Docker (Recommended)
```bash
git clone https://github.com/Cypher-redeye/Cresta.git
cd Cresta
docker-compose up --build
```
* Frontend: `http://localhost:5173`
* Backend API: `http://localhost:8000/api/`

### Without Docker
```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env       # Fill in values
python manage.py migrate
python manage.py runserver

# Frontend
cd frontend
npm install
npm run dev
```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|---|---|
| `SECRET_KEY` | Django secret key |
| `DEBUG` | `False` in production |
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection URL |
| `ALLOWED_HOSTS` | Comma-separated allowed hosts |
| `CORS_ALLOWED_ORIGINS` | Frontend URL(s) |
| `EMAIL_HOST_USER` | SMTP sender address |
| `EMAIL_HOST_PASSWORD` | SMTP app password |
| `FRONTEND_URL` | Frontend URL for email verification links |
| `GEMINI_API_KEY` | Google Gemini API Key for the Chatbot |

---

## 🆕 Recent Updates & Changelog

- **Forecast Engine Optimization:** Achieved faster generation times by running LSTM, XGBoost, and ARIMA ensembles concurrently via `ThreadPoolExecutor` and optimizing ARIMA grid-search parameters.
- **Deep Localization (i18n):** Completed full translation and rollout of Hindi, Gujarati, and Punjabi support across all dashboard components and AI reasoning views.
- **Settings Dashboard Overhaul:** Deployed advanced configurations for Risk Management, Notification Preferences, Account Security, and Currency Defaults.
- **Auth & Onboarding Flow Fixes:** Resolved edge-case login/register blocks and fixed recurring Risk Assessment prompts for Google OAuth users by syncing Django models with accurate timestamps.
- **UI & Graphing Tying:** Addressed missing rendering of 7-day forecast graphs on specific stock tickers and ironed out data-fetching states.
- **AI Chatbot Integration:** Embedded a real-time conversational co-pilot powered by Gemini 2.5 Flash.
- **Security & Quality Audit:** Removed legacy code, optimized component rendering, and ensured complete protection against prompt injection and XSS.

---

## 🗺️ Roadmap

- [ ] **DigitalOcean Deployment** — containerized ML stack utilizing GitHub Student Developer Pack ($200 credits)
- [x] **Portfolio Backtesting** — simulate historical strategy vs Nifty50 benchmark with Sharpe ratio, drawdown, CAGR ✅
- [ ] **Options Chain Analyzer** — IV and Greeks visualization for F&O traders
- [ ] **Mutual Fund Coverage** — extend AI scoring to top 50 Indian MFs
- [ ] **Mobile App** — React Native port with push-based watchlist alerts
- [ ] **SEBI Compliance Pipeline** — auditable reasoning logs for RIA regulations

---

## 📚 Academic References

* Hochreiter, S., & Schmidhuber, J. (1997). Long Short-Term Memory. *Neural Computation*, 9(8), 1735–1780.
* Vaswani, A., et al. (2017). Attention Is All You Need. *NeurIPS*.
* Araci, D. (2019). FinBERT: Financial Sentiment Analysis with Pre-trained Language Models. *arXiv:1908.10063*.
* Chen, T., & Guestrin, C. (2016). XGBoost: A Scalable Tree Boosting System. *KDD '16*.
* Markowitz, H. (1952). Portfolio Selection. *Journal of Finance*, 7(1), 77–91.

## Contributors

<div align="center">

| [<img src="https://github.com/ankitrmishra01.png" width="100px;"/><br /><sub><b>Ankit Mishra</b></sub>](https://github.com/ankitrmishra01) | [<img src="https://github.com/Shivam-Panchal0210.png" width="100px;"/><br /><sub><b>Shivam Panchal</b></sub>](https://github.com/Shivam-Panchal0210) | [<img src="https://github.com/shubhamjhadhoni-jpg.png" width="100px;"/><br /><sub><b>Shubham Jhadhoni</b></sub>](https://github.com/shubhamjhadhoni-jpg) | [<img src="https://github.com/Cypher-redeye.png" width="100px;"/><br /><sub><b>Om Sharma</b></sub>](https://github.com/Cypher-redeye) |
| :---: | :---: | :---: | :---: |

</div>

---
</div>

---

*Cresta is a production-ready, highly localized Robo-Advisory platform demonstrating the viable intersection of behavioral finance, deep learning, and modern web architecture.*
