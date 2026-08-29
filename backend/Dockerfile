FROM python:3.12-slim

WORKDIR /app

# System deps for psycopg2, torch
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc libpq-dev && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt gunicorn psycopg2-binary celery redis whitenoise

COPY . .

# Collect static files
RUN python manage.py collectstatic --noinput 2>/dev/null || true

# Create dirs for model storage
RUN mkdir -p saved_models recommender/saved_models logs

# P1-6 FIX: Run as non-root user (Hugging Face Spaces requires UID 1000)
RUN useradd -m -u 1000 user && chown -R user:user /app
USER user

EXPOSE 7860

CMD ["gunicorn", "robo_advisor.wsgi:application", "--bind", "0.0.0.0:7860", "--workers", "3", "--timeout", "120"]
