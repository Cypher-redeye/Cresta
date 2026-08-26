# Cresta Chatbot & Conversational AI Module

**Lead:** Shubham Jha (Chatbot & Conversational AI Lead, Parul University)

## Overview
This directory contains the autonomous financial co-pilot engine for Cresta. The chatbot is designed to assist retail investors with real-time portfolio inquiries, stock price forecasting, market data queries, and historical backtests.

## Key Features
- **Multi-LLM Failover Engine:** Primary inference routed through ultra-fast **Groq (`qwen/qwen3.8-27b`)** with automated fallback to **Google Gemini 2.5 Flash**.
- **Autonomous Tool Calling:** Powered by LangChain, executing 7 live backend financial tools:
  - `get_portfolio`: Queries holdings, quantities, buy prices, and calculated unrealized P&L.
  - `get_forecast`: Generates 7-day walk-forward price predictions.
  - `get_market_data`: Fetches live NSE quotes and benchmark index values.
  - `run_backtest`: Backtests buy-and-hold strategies over configurable historical periods.
  - `get_news_sentiment`: Extracts FinBERT sentiment scores for specific tickers.
  - `get_risk_profile`: Fetches user risk class and contributing factors.
  - `create_alert`: Sets automated price threshold alerts.
- **SSE Streaming:** Token-by-token Server-Sent Events for real-time text streaming.
- **Multilingual System Prompts:** Full conversational fluency in English and Hindi.

## Module Structure
- `views.py` — SSE streaming endpoint (`/api/chat/`), failover logic, and tool loop controller.
- `tools.py` — LangChain `@tool` function definitions binding Django models and ML predictors.
- `prompts.py` — System prompts and localization formatting.
- `memory.py` — Conversation history buffers and message persistence.
- `urls.py` — URL routing declarations for the chatbot app.
