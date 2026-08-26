<div align="center">

<img src="frontend/public/favicon.svg" width="70" height="70" alt="Cresta Logo" />

# CRESTA
### Intelligent AI Robo-Advisory System for Indian Equity Markets

[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![Django](https://img.shields.io/badge/Django-5.x-092E20?style=for-the-badge&logo=django)](https://djangoproject.com/)
[![PyTorch](https://img.shields.io/badge/PyTorch-ML_Pipeline-EE4C2C?style=for-the-badge&logo=pytorch)](https://pytorch.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-336791?style=for-the-badge&logo=postgresql)](https://postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-Cache-DC382D?style=for-the-badge&logo=redis)](https://redis.io/)
[![Docker](https://img.shields.io/badge/Docker-Containerized-2496ED?style=for-the-badge&logo=docker)](https://docker.com/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

**[Live Platform](https://crestafinance.me)** · **[About the Team](#-founding-team)** · **[Architecture](#-system-architecture)** · **[Features](#-core-features)** · **[Installation](#-getting-started)**

</div>

---

## 📌 Executive Summary

**Cresta** is an open-source, production-grade AI robo-advisory platform engineered specifically for Indian retail and middle-class investors. 

### The Problem
Millions of middle-class individuals avoid the stock market because they perceive investing as equivalent to **gambling**, or are forced to rely on **expensive wealth managers and advisory firms** that charge heavy commissions for basic stock recommendations.

### The Cresta Solution
Cresta eliminates costly intermediaries by democratizing institutional-grade quantitative intelligence:
- **Zero Costly Intermediaries:** Automated quantitative models replace fee-heavy advisory firms.
- **Demystifying Volatility:** Clear, explainable AI scores (Sentiment, Valuation, Risk Fit) eliminate gambling fears.
- **Inclusive Accessibility:** Full multilingual support across **Hindi, Gujarati, Punjabi, and English**.
- **Real-Time Execution:** Multi-LLM financial agent with tool-calling capabilities that inspects holdings, generates forecasts, and executes backtests on the fly.

---

## 📸 Platform Showcase & Screenshots

<table width="100%">
  <tr>
    <td align="center" width="50%">
      <img src="docs/screenshots/01-landing-dark.png" alt="Dark Mode Landing" width="100%" />
      <br /><sub><b>Dark Mode Landing</b> — Real-time NIFTY/SENSEX ticker, 3D interactive globe, and market summary.</sub>
    </td>
    <td align="center" width="50%">
      <img src="docs/screenshots/02-landing-light.png" alt="Light Mode Landing" width="100%" />
      <br /><sub><b>Light Mode Landing</b> — High-contrast daylight view adapting palettes dynamically.</sub>
    </td>
  </tr>
  <tr>
    <td align="center" width="50%">
      <img src="docs/screenshots/06-dashboard.png" alt="Portfolio Dashboard" width="100%" />
      <br /><sub><b>Portfolio Dashboard</b> — Real-time INR (₹) holdings valuation, P&L, allocation donut, and AI alerts.</sub>
    </td>
    <td align="center" width="50%">
      <img src="docs/screenshots/07-holdings-ai-advisor.png" alt="Holdings and AI Advisor" width="100%" />
      <br /><sub><b>Holdings & Signal Breakdown</b> — BUY/SELL/HOLD scoring based on Sentiment, Risk Fit, and Valuation.</sub>
    </td>
  </tr>
  <tr>
    <td align="center" width="50%">
      <img src="docs/screenshots/12-backtest.png" alt="Portfolio Backtesting" width="100%" />
      <br /><sub><b>Strategy Backtesting</b> — Historical simulations against the NIFTY 50 benchmark.</sub>
    </td>
    <td align="center" width="50%">
      <img src="docs/screenshots/13-backtest-results.png" alt="Backtest Results" width="100%" />
      <br /><sub><b>Backtest Analytics</b> — Sharpe ratio, maximum drawdown, CAGR, and equity curves.</sub>
    </td>
  </tr>
  <tr>
    <td align="center" width="50%">
      <img src="docs/screenshots/14-risk-assement.png" alt="Risk Assessment" width="100%" />
      <br /><sub><b>Behavioral Risk Profiling</b> — Multi-phase questionnaire powered by an XGBoost classification model.</sub>
    </td>
    <td align="center" width="50%">
      <img src="docs/screenshots/08-market-watch.png" alt="Market Watch" width="100%" />
      <br /><sub><b>Market Watch & Forecasts</b> — 30-day historical quotes + 7-day walk-forward machine learning forecast.</sub>
    </td>
  </tr>
  <tr>
    <td align="center" width="50%">
      <img src="docs/screenshots/11-hindi-mode.png" alt="Hindi Mode" width="100%" />
      <br /><sub><b>Deep Regional Localization</b> — Complete Hindi interface support across analytics and reasoning.</sub>
    </td>
    <td align="center" width="50%">
      <img src="docs/screenshots/09-market-news.png" alt="Personalized News" width="100%" />
      <br /><sub><b>FinBERT News Feed</b> — Financial sentiment scoring across recent stock headlines.</sub>
    </td>
  </tr>
</table>

---

## 🚀 Core Features

### 1. 🤖 Intelligent Conversational Co-Pilot (Multi-LLM Failover)
* **Hybrid Model Architecture:** High-speed **Groq (`qwen/qwen3.8-27b`)** primary engine (sub-0.3s response time) backed by **Google Gemini 2.5 Flash** fallback.
* **Autonomous Tool Calling:** The LLM actively invokes 7 live Python backend tools:
  * `get_portfolio(user_id)` — Queries live holdings, buy prices, and calculated unrealized P&L.
  * `get_forecast(ticker)` — Generates on-demand 7-day price bounds.
  * `get_market_data(ticker)` — Fetches live quotes for NSE equities and benchmark indices (`^NSEI`, `^BSESN`).
  * `run_backtest(ticker, period, capital)` — Backtests buy-and-hold strategies against historical data.
  * `get_news_sentiment(ticker)` — Analyzes news headlines using FinBERT.
  * `get_risk_profile(user_id)` — Inspects investor risk tier and behavioral factors.
  * `create_alert(ticker, price, direction)` — Sets price thresholds with automated triggers.
* **Direct Shortcut Integration:** Dedicated *"Ask AI"* button embedded directly within the Portfolio Allocation card.

### 2. 📊 Quantitative Machine Learning Stack
* **7-Day Price Forecast Ensemble:**
  * **Attention LSTM (70% weight):** Captures multi-day temporal sequence dependencies.
  * **ARIMA (20% weight):** Accounts for linear trend lines and mean reversion.
  * **XGBoost (10% weight):** Ingests technical momentum indicators (RSI, MACD, Bollinger Bands).
* **FinBERT Sentiment Analysis:** Pre-trained NLP model analyzes live headlines from Reuters, Economic Times, and Yahoo Finance, scoring sentiment from `-1.0` (Bearish) to `+1.0` (Bullish).
* **Behavioral Risk Profiler:** XGBoost classifier trained on real investor survey datasets to assign Conservative, Moderate, or Aggressive profiles with dynamic reassessment scheduling.

### 3. 🧪 Historical Backtesting Engine
* Simulates capital growth over 6-month, 1-year, and 2-year periods against the **NIFTY 50** index.
* Computes institutional-grade risk metrics:
  * **Sharpe Ratio** (risk-adjusted return)
  * **Maximum Drawdown (MDD)** (peak-to-trough capital loss)
  * **Compound Annual Growth Rate (CAGR)**
  * **Win/Loss Volatility Curves**

### 4. 💼 Portfolio Management & Allocation Sandbox
* Live tracking of Indian stocks (NSE/BSE) with daily P&L and invested values formatted in **INR (₹)**.
* **What-If Sandbox Mode:** Interactive sliders let investors simulate rebalanced portfolio distributions without affecting actual capital.

### 5. 🛡️ Security & Enterprise Auth
* **HttpOnly JWT Cookie Rotation:** Access tokens stored securely in memory with automated silent refresh on token expiration.
* **CSRF Double-Submit Protection:** Strict origin verification across all mutating endpoints.
* **Google OAuth 2.0 & Email Verification:** Token-based activation flow with 24-hour validity windows.

---

## 🏗️ System Architectures

### 1. High-Level Infrastructure & Request Flow
```mermaid
graph TD
    User([Investor Client]) -->|HTTPS / WSS| NGINX[NGINX Reverse Proxy]
    NGINX -->|Frontend Static| ReactVite[React 18 + Vite SPA]
    NGINX -->|API Calls /api/| Django[Django REST Framework]

    subgraph Backend Core
        Django --> Auth[JWT & Google OAuth]
        Django --> Portfolio[Portfolio & Holdings Engine]
        Django --> MarketData[Live Market Scraper / YFinance]
        Django --> LLMManager[Chatbot Multi-LLM Manager]
    end

    subgraph LLM & Tools
        LLMManager -->|Primary| Groq[Groq Qwen 3.8 27B]
        LLMManager -->|Fallback| Gemini[Google Gemini 2.5 Flash]
        LLMManager -.-> Tools[7 Quantitative Execution Tools]
    end

    subgraph ML Pipeline
        Django --> Ensemble[Ensemble Predictor]
        Ensemble --> LSTM[Attention LSTM]
        Ensemble --> ARIMA[ARIMA Model]
        Ensemble --> XGB[XGBoost Regressor]
        Django --> FinBERT[FinBERT Sentiment Analyzer]
    end

    subgraph Persistence Layer
        Django --> Postgres[(PostgreSQL DB)]
        Django --> Redis[(Redis Cache & Broker)]
        Redis --> Celery[Celery Task Workers]
    end
```

### 2. Quantitative Machine Learning & Sentiment Pipeline
```mermaid
flowchart LR
    A["Historical OHLCV + Ticker Feed"] --> B["Feature Engineering (RSI, MACD, SMA)"]
    B --> C["Attention-LSTM Model (70%)"]
    B --> D["ARIMA Model (20%)"]
    B --> E["XGBoost Regressor (10%)"]
    C --> F["Dynamic Weighted Ensemble"]
    D --> F
    E --> F
    F --> G["7-Day Price Forecast Bounds"]

    H["Live Financial News RSS"] --> I["FinBERT Transformer NLP"]
    I --> J["Sentiment Score (-1.0 to +1.0)"]

    K["NFCS Investor Survey Dataset"] --> L["XGBoost Risk Classifier"]
    L --> M["Investor Risk Category (Conservative / Moderate / Aggressive)"]

    G --> N["Explainable Recommendation Engine"]
    J --> N
    M --> N
```

### 3. Database Entity-Relationship (ER) Schema
```mermaid
erDiagram
    USER ||--o{ HOLDING : owns
    USER ||--o{ TRANSACTION : executes
    USER ||--o{ WATCHLIST_ITEM : monitors
    USER ||--o{ WATCHLIST_ALERT : configures
    USER ||--o{ RISK_PROFILE : maintains
    
    USER {
        int id PK
        string username
        string email
        boolean is_email_verified
        datetime date_joined
    }
    RISK_PROFILE {
        int id PK
        int user_id FK
        string risk_category
        float risk_score
        json factor_breakdown
        datetime last_assessed
    }
    HOLDING {
        int id PK
        int user_id FK
        string ticker
        string stock_name
        int quantity
        float avg_buy_price
    }
    TRANSACTION {
        int id PK
        int user_id FK
        string ticker
        string transaction_type
        int quantity
        float price
        datetime executed_at
    }
    WATCHLIST_ALERT {
        int id PK
        int user_id FK
        string ticker
        float target_price
        string direction
        boolean is_triggered
    }
```

---

## 📂 Team & Repository Structure

The codebase is organized into **4 independent core modules**, allowing each team lead to develop, test, and commit autonomously:

```
Cresta/
├── frontend/               # 🎨 Om Sharma (Frontend Lead)
│   ├── src/                # React 18, Tailwind, Framer Motion, i18n
│   ├── public/             # Branding assets, SVGs, favicon
│   └── package.json
│
├── backend/                # 🛠️ Ankit Mishra (Team Leader & Backend Lead)
│   ├── advisor/            # Authentication, Portfolio, Market APIs
│   ├── robo_advisor/       # Django settings, WSGI/ASGI, URLs
│   ├── Dockerfile
│   └── manage.py
│
├── ml_model/               # 🧠 Shivam Panchal (Machine Learning Lead)
│   ├── recommender/        # Attention-LSTM, ARIMA, XGBoost ensemble
│   ├── backtest.py         # Strategy backtesting runner
│   ├── calc_accuracy.py    # Walk-forward accuracy validator
│   └── README.md
│
├── chatbot/                # 🤖 Shubham Jha (Chatbot & NLP Lead)
│   ├── views.py            # Multi-LLM failover (Groq + Gemini), SSE streaming
│   ├── tools.py            # 7 autonomous LangChain financial execution tools
│   ├── prompts.py          # Multilingual system prompts (EN/HI)
│   ├── memory.py           # Conversation history manager
│   └── README.md
│
├── docs/screenshots/       # 📸 Visual platform walkthroughs
└── docker-compose.yml      # 🐳 Multi-container orchestration
```

---

## 👥 Founding Team

Developed at **Parul University, Vadodara, Gujarat**:

<div align="center">

| [<img src="https://github.com/ankitrmishra01.png" width="105px;"/><br /><b>Ankit Mishra</b>](https://github.com/ankitrmishra01) | [<img src="https://github.com/Cypher-redeye.png" width="105px;"/><br /><b>Om Sharma</b>](https://github.com/Cypher-redeye) | [<img src="https://github.com/Shivam-Panchal0210.png" width="105px;"/><br /><b>Shivam Panchal</b>](https://github.com/Shivam-Panchal0210) | [<img src="https://avatars.githubusercontent.com/u/251105683?s=400&u=f797f853515cdd7cabe819d4b5656cf6b70eb82b&v=4" width="105px;"/><br /><b>Shubham Jha</b>](https://github.com/account) |
| :---: | :---: | :---: | :---: |
| **Team Leader**<br />*Backend & Integration Lead* | **Frontend Lead**<br />*UI/UX & Architecture* | **ML Lead**<br />*Quant & Model Ensembles* | **Chatbot Lead**<br />*NLP & Conversational AI* |
| [![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=flat&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/ankitrmishra01) | [![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=flat&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/om-sharma38) | [![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=flat&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/shivam-panchal-7471052a5) | [![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=flat&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/shubham-jha-986520312) |

</div>

---

## ⚙️ Tech Stack

| Domain | Technologies |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, Framer Motion, Lucide Icons, Recharts, Lenis Smooth Scroll, i18next |
| **Backend** | Python 3.12, Django 5.x, Django REST Framework, SimpleJWT, Celery, Redis |
| **AI / LLMs** | LangChain, Groq (`qwen/qwen3.8-27b`), Google GenAI (`gemini-2.5-flash`), Tool Calling |
| **Machine Learning** | PyTorch, XGBoost, Statsmodels (ARIMA), Transformers (ProsusAI FinBERT), Scikit-Learn |
| **Database & Cache** | PostgreSQL 16, Redis 7 (caching, celery broker & throttle tracking) |
| **Infrastructure** | Docker, Docker Compose, NGINX Reverse Proxy, Linux Alpine |

---

## 🛠️ Getting Started

### Prerequisites
* [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Docker 24+, Docker Compose v2)
* Node.js 18+ (for local frontend development)
* Python 3.12+ (for local backend development)

### Quick Start (Dockerized)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/ankitrmishra01/Cresta1.git
   cd Cresta1
   ```

2. **Configure environment variables:**
   Create `.env` in the root folder:
   ```env
   SECRET_KEY=your-super-secret-django-key
   DEBUG=True
   ALLOWED_HOSTS=localhost,127.0.0.1,0.0.0.0
   CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

   # Database & Redis
   DATABASE_URL=postgres://postgres:postgres@db:5432/cresta_db
   REDIS_URL=redis://redis:6379/0

   # AI LLM Keys
   GROQ_API_KEY=your-groq-api-key
   GEMINI_API_KEY=your-gemini-api-key

   # SMTP Email Verification
   EMAIL_HOST_USER=your-email@gmail.com
   EMAIL_HOST_PASSWORD=your-app-password
   ```

3. **Launch the platform:**
   ```bash
   docker compose up --build -d
   ```

4. **Verify running containers:**
   ```bash
   docker ps
   ```
   * `cresta-backend-1`: `http://localhost:8000`
   * `cresta-frontend-1`: `http://localhost:80` (or `http://localhost:5173` if running Vite locally)
   * `cresta-db-1`: PostgreSQL port `5432`
   * `cresta-redis-1`: Redis port `6379`
   * `cresta-celery_worker-1`: Celery background tasks

---

## 📡 API Overview

| Endpoint | Method | Description |
|---|---|---|
| `/api/auth/google/` | `POST` | Google OAuth token exchange & user sync |
| `/api/auth/token/` | `POST` | User login & JWT issuance |
| `/api/auth/refresh/` | `POST` | Silent JWT access token refresh |
| `/api/profile/save/` | `POST` | Persist risk questionnaire scores |
| `/api/recommend/` | `POST` | Generate XGBoost + FinBERT stock suggestions |
| `/api/chat/` | `POST` | Real-time SSE streaming conversational AI |
| `/api/market-status/` | `GET` | Live NIFTY, SENSEX, USD/INR, and Gold rates |
| `/api/holdings/` | `GET/POST` | Fetch or add portfolio stock entries |
| `/api/backtest/` | `POST` | Execute quantitative historical backtest |

---

## 📄 License & Academic Disclaimer

Distributed under the **MIT License**. See `LICENSE` for more information.

*Disclaimer: Cresta is an academic engineering project developed at Parul University for educational, research, and simulation purposes. Cresta is not a SEBI-registered investment advisor.*
