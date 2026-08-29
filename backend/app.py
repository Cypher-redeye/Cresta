import os
import subprocess
import sys

def main():
    print("Starting Django server on Hugging Face Spaces...")
    
    # Run database migrations
    print("Running migrations...")
    subprocess.run([sys.executable, "manage.py", "migrate", "--noinput"], check=False)
    
    # Collect static files
    print("Collecting static files...")
    subprocess.run([sys.executable, "manage.py", "collectstatic", "--noinput"], check=False)
    
    # Create necessary directories
    os.makedirs("saved_models", exist_ok=True)
    os.makedirs("recommender/saved_models", exist_ok=True)
    os.makedirs("logs", exist_ok=True)
    
    # Start Gunicorn server binding to port 7860 (Hugging Face default)
    print("Starting Gunicorn...")
    os.system("gunicorn robo_advisor.wsgi:application --bind 0.0.0.0:7860 --workers 3 --timeout 120")

if __name__ == "__main__":
    main()
