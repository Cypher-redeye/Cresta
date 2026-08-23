// Centralized API configuration with JWT support
// P0-1 FIX: Use env var for API base URL (no hardcoded localhost)
export const API_BASE = import.meta.env.VITE_API_BASE || '/api';

/**
 * Utility to get a cookie value by name.
 */
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

/**
 * Make an authenticated API call using HttpOnly cookies.
 * On 401, attempts to refresh the token once and retry.
 */
export async function apiCall(url, options = {}) {
    const fullUrl = url.startsWith('http') ? url : `${API_BASE}${url}`;
    const headers = { ...(options.headers || {}) };

    if (options.body && typeof options.body === 'string' && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
    }

    const token = localStorage.getItem('access_token');
    if (token && !headers['Authorization']) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // P0: Inject CSRF token for mutating requests
    const method = (options.method || 'GET').toUpperCase();
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        const csrfToken = getCookie('csrftoken');
        if (csrfToken) {
            headers['X-CSRFToken'] = csrfToken;
        }
    }

    let response = await fetch(fullUrl, { ...options, headers, credentials: 'include' });

    if (response.status === 401) {
        const refreshed = await refreshToken();
        if (refreshed) {
            // Retry request; browser will automatically attach the new HttpOnly cookie
            response = await fetch(fullUrl, { ...options, headers, credentials: 'include' });
        }
    }
    return response;
}

/**
 * Refresh the access token using httpOnly refresh cookie.
 */
export async function refreshToken() {
    try {
        const headers = { 'Content-Type': 'application/json' };
        const csrfToken = getCookie('csrftoken');
        if (csrfToken) {
            headers['X-CSRFToken'] = csrfToken;
        }

        const response = await fetch(`${API_BASE}/auth/refresh/`, {
            method: 'POST',
            headers,
            credentials: 'include',
            body: JSON.stringify({}),
        });
        
        if (response.ok) {
            return true;
        } else {
            localStorage.removeItem('user');
            return false;
        }
    } catch {
        return false;
    }
}
