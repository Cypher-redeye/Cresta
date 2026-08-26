# Cresta Quantitative Machine Learning Pipeline

**Lead:** Shivam Panchal (Machine Learning Lead, Parul University)

## Overview
This directory contains the core machine learning models, quantitative predictors, financial sentiment analyzers, and risk profiling algorithms for Cresta.

## Core Models & Architectures

### 1. 7-Day Ensemble Price Predictor
- **Attention LSTM (70% weight):** Deep sequential neural network with multi-head attention mechanism trained on historical daily OHLCV data.
- **ARIMA (20% weight):** Autoregressive Integrated Moving Average model capturing linear trends, seasonality, and mean-reversion dynamics.
- **XGBoost Regressor (10% weight):** Gradient boosted decision trees trained on momentum indicators (RSI, MACD, Bollinger Bands, Volume SMA).
- **Validation:** Strict 3-fold walk-forward validation (minimum 45-day out-of-sample folds) to guarantee zero look-ahead bias.

### 2. FinBERT Financial News Sentiment
- Pre-trained transformer (`ProsusAI/finbert`) fine-tuned on financial phrasebanks.
- Ingests live RSS headlines for NSE-listed equities from Reuters, Economic Times, and Yahoo Finance.
- Scores sentiment continuously from `-1.0` (Strongly Bearish) to `+1.0` (Strongly Bullish).

### 3. Behavioral Risk Classification
- XGBoost classifier trained on National Financial Capability Study (NFCS) survey data.
- Maps multi-factor behavioral responses (horizon, liquidity needs, loss tolerance) into Conservative, Moderate, or Aggressive investor tiers.

## Directory Structure
- `recommender/` — Core recommendation logic, feature engineering, and ensemble predictors:
  - `ensemble_predictor.py` — Dynamic LSTM + ARIMA + XGBoost ensemble engine.
  - `stock_predictor.py` — Stock forecast inference and cache management.
  - `risk_profiler.py` — XGBoost risk tolerance scoring.
  - `sentiment.py` — FinBERT news scraping and NLP scoring.
  - `features.py` — Technical indicator calculation (RSI, MACD, SMA).
  - `backtester.py` — Historical simulation and equity curve calculation.
- `backtest.py` — Standalone quantitative backtesting runner.
- `calc_accuracy.py` — Walk-forward validation and directional accuracy verification.
