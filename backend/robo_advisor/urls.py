"""
URL configuration for robo_advisor project.
"""

from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from django.db import connection
from django.core.cache import cache


def health_check(request):
    """7.4 FIX: Health check endpoint for load balancer."""
    health = {"status": "ok"}
    # Check DB
    try:
        connection.ensure_connection()
        health["db"] = True
    except Exception:
        health["db"] = False
        health["status"] = "degraded"
    # Check Redis/cache
    try:
        cache.set("health_ping", "pong", timeout=5)
        health["cache"] = cache.get("health_ping") == "pong"
    except Exception:
        health["cache"] = False
    return JsonResponse(health)


from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    # P0-6 FIX: Admin restricted (Nginx blocks it publicly; keep for local/internal use)
    path("admin/", admin.site.urls),
    path("api/", include("advisor.urls")),
    path("api/", include("chatbot.urls")),
    path("health/", health_check, name='health_check'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
