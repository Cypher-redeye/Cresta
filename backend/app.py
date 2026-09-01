import os
import subprocess
import sys
import spaces
import gradio as gr
from fastapi.middleware.wsgi import WSGIMiddleware

print("Starting Django + Gradio ZeroGPU monkeypatch...")

# 1. Run migrations and collect static
subprocess.run([sys.executable, "manage.py", "migrate", "--noinput"], check=False)
subprocess.run([sys.executable, "manage.py", "collectstatic", "--noinput"], check=False)

os.makedirs("saved_models", exist_ok=True)
os.makedirs("recommender/saved_models", exist_ok=True)
os.makedirs("logs", exist_ok=True)

# 2. Setup Django
import django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "robo_advisor.settings")
django.setup()
from robo_advisor.wsgi import application as django_app

# 3. Monkeypatch Gradio to mount Django
if hasattr(gr.routes.App, "create_app"):
    original_create_app = gr.routes.App.create_app

    def custom_create_app(*args, **kwargs):
        app = original_create_app(*args, **kwargs)
        print("Mounting Django WSGI app onto Gradio FastAPI app...")
        app.mount("/api", WSGIMiddleware(django_app))
        return app

    gr.routes.App.create_app = custom_create_app
else:
    print("WARNING: gr.routes.App.create_app not found! The monkeypatch might fail.")

# 4. Create the dummy GPU function and launch!
@spaces.GPU
def dummy_gpu():
    return "GPU is ready!"

demo = gr.Interface(fn=dummy_gpu, inputs="text", outputs="text")

print("Launching Gradio interface...")
demo.launch()

