"""
Server-side session management.

Sessions are stored in the `sessions` DB table and referenced by
an HttpOnly cookie. This eliminates XSS token-theft risk that JWT
stored in localStorage would have (OWASP Session Management Cheat Sheet).
"""
import os
import secrets
from datetime import datetime, timedelta, timezone

from flask import request, make_response

from app.extensions import db
from app.models import UserSession


SESSION_COOKIE_NAME = 'session_token'


def create_session(user_id, ip_address=None, fully_authenticated=False):
    """
    Create a new server-side session and return the token.
    Pass fully_authenticated=False for the 'password verified, awaiting 2FA' state.
    """
    expiry_minutes = int(os.environ.get('SESSION_EXPIRY_MINUTES', 30))
    token = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=expiry_minutes)

    session = UserSession(
        user_id=user_id,
        token=token,
        is_fully_authenticated=fully_authenticated,
        expires_at=expires_at,
        ip_address=ip_address,
    )
    db.session.add(session)
    db.session.commit()
    return token


def validate_session(token, require_full_auth=True):
    """
    Validate a session token from the cookie.
    Returns the UserSession row if valid, or None.
    Pass require_full_auth=False to allow partial-auth sessions (during 2FA step).
    """
    if not token:
        return None

    session = UserSession.query.filter_by(token=token).first()
    if not session:
        return None

    # Check expiry
    if datetime.now(timezone.utc) > session.expires_at.replace(tzinfo=timezone.utc):
        db.session.delete(session)
        db.session.commit()
        return None

    if require_full_auth and not session.is_fully_authenticated:
        return None

    return session


def upgrade_session(token):
    """Upgrade a partial-auth session to fully authenticated after 2FA completion."""
    session = UserSession.query.filter_by(token=token).first()
    if session:
        # Regenerate token to prevent session fixation
        new_token = secrets.token_urlsafe(32)
        session.token = new_token
        session.is_fully_authenticated = True
        db.session.commit()
        return new_token
    return None


def expire_session(token):
    """Delete a session (logout)."""
    session = UserSession.query.filter_by(token=token).first()
    if session:
        db.session.delete(session)
        db.session.commit()


def get_token_from_request():
    """Extract session token from the request cookie."""
    return request.cookies.get(SESSION_COOKIE_NAME)


def set_session_cookie(response, token):
    """Set the session cookie with security flags."""
    # SameSite=None required for cross-domain (Netlify <-> PythonAnywhere)
    # Secure=True required when SameSite=None
    import os
    is_production = os.environ.get('FLASK_ENV', 'development') == 'production'

    response.set_cookie(
        SESSION_COOKIE_NAME,
        token,
        httponly=True,
        secure=is_production,
        samesite='None' if is_production else 'Lax',
        max_age=int(os.environ.get('SESSION_EXPIRY_MINUTES', 30)) * 60,
        path='/',
    )
    return response


def clear_session_cookie(response):
    """Remove the session cookie."""
    response.delete_cookie(SESSION_COOKIE_NAME, path='/')
    return response
