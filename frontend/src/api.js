// Centralized API configuration with JWT support
// Default to /api to use Vite dev proxy (eliminates all CORS & browser connection drops)
export const API_BASE = '/api';

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
            // Retry request with the newly refreshed access token
            const newToken = localStorage.getItem('access_token');
            const retryHeaders = { ...headers };
            if (newToken) {
                retryHeaders['Authorization'] = `Bearer ${newToken}`;
            }
            response = await fetch(fullUrl, { ...options, headers: retryHeaders, credentials: 'include' });
        }
    }
    return response;
}

/**
 * Refresh the access token using httpOnly refresh cookie or stored refresh token.
 */
export async function refreshToken() {
    try {
        const headers = { 'Content-Type': 'application/json' };
        const csrfToken = getCookie('csrftoken');
        if (csrfToken) {
            headers['X-CSRFToken'] = csrfToken;
        }

        const storedRefresh = localStorage.getItem('refresh_token');
        const response = await fetch(`${API_BASE}/auth/refresh/`, {
            method: 'POST',
            headers,
            credentials: 'include',
            body: JSON.stringify({ refresh: storedRefresh || undefined }),
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.tokens?.access) {
                localStorage.setItem('access_token', data.tokens.access);
                if (data.tokens.refresh) {
                    localStorage.setItem('refresh_token', data.tokens.refresh);
                }
            }
            return true;
        } else {
            return false;
        }
    } catch {
        return false;
    }
}
