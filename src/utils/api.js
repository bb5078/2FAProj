/**
 * Real API client — replaces mockApi.js.
 *
 * VITE_API_URL is set in .env (dev) or Netlify environment variables (prod).
 * credentials: 'include' is required for cross-domain session cookies
 * (Netlify frontend <-> PythonAnywhere backend).
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/** Cached CSRF token fetched on first authenticated request. */
let _csrfToken = null;

async function getCsrfToken() {
    if (_csrfToken) return _csrfToken;
    try {
        const res = await fetch(`${BASE_URL}/api/auth/csrf-token`, {
            credentials: 'include',
        });
        const data = await res.json();
        _csrfToken = data.csrf_token || null;
    } catch {
        _csrfToken = null;
    }
    return _csrfToken;
}

async function request(path, opts = {}) {
    const headers = { 'Content-Type': 'application/json', ...opts.headers };

    // Attach CSRF token for state-changing methods
    if (opts.method && opts.method !== 'GET') {
        const csrf = await getCsrfToken();
        if (csrf) headers['X-CSRFToken'] = csrf;
    }

    const response = await fetch(`${BASE_URL}${path}`, {
        credentials: 'include',
        headers,
        ...opts,
    });

    // If CSRF token expired/invalid, clear cache so it refreshes on next call
    if (response.status === 400) {
        _csrfToken = null;
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
        // Flask returned an HTML error page (e.g. CSRF rejection) — surface it clearly
        throw new Error(`Server error ${response.status}`);
    }

    return response.json();
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export const register = (data) =>
    request('/api/auth/register', { method: 'POST', body: JSON.stringify(data) });

export const login = (data) =>
    request('/api/auth/login', { method: 'POST', body: JSON.stringify(data) });

export const logout = () =>
    request('/api/auth/logout', { method: 'POST' });

export const getMe = () =>
    request('/api/auth/me');

export const setMfaMethod = (method, phone = null) =>
    request('/api/auth/set-mfa-method', { method: 'POST', body: JSON.stringify({ method, phone }) });

export const resetRequest = (email) =>
    request('/api/auth/reset-request', { method: 'POST', body: JSON.stringify({ email }) });

export const resetConfirm = (token, password) =>
    request('/api/auth/reset-confirm', { method: 'POST', body: JSON.stringify({ token, password }) });

export const getAuthInternals = () =>
    request('/api/auth/internals');

// ── OTP ───────────────────────────────────────────────────────────────────────

export const sendOTP = (method) =>
    request('/api/otp/send', { method: 'POST', body: JSON.stringify({ method }) });

export const verifyOTP = (code) =>
    request('/api/otp/verify', { method: 'POST', body: JSON.stringify({ code }) });

// ── TOTP ──────────────────────────────────────────────────────────────────────

export const getTOTPSetup = () =>
    request('/api/totp/setup');

export const verifyTOTP = (code) =>
    request('/api/totp/verify', { method: 'POST', body: JSON.stringify({ code }) });
