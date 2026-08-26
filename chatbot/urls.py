# chatbot/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path("chat/", views.chat_stream, name="chat_stream"),
    path("chat/clear/", views.chat_clear, name="chat_clear"),
]
