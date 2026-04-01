"""
Security guards — brute-force protection and auth event logging.

All auth events (success AND failure) must be written to auth_logs.
NIST SP 800-63-3 / OWASP Authentication Cheat Sheet compliance.
"""
import os
from datetime import datetime, timezone

from app.extensions import db
from app.models import AuthLog, User


def log_auth_event(user_id, event_type, success, ip_address, method=None):
    """
    Write an entry to auth_logs for every auth event.
    user_id may be None for failed login attempts where user is not found.
    """
    entry = AuthLog(
        user_id=user_id,
        event_type=event_type,
        method=method,
        success=success,
        ip_address=ip_address,
    )
    db.session.add(entry)
    db.session.commit()


def check_account_locked(user):
    """
    Returns True if the account is locked.
    Callers should abort with 423 if this returns True.
    """
    return user.is_locked


def increment_failed_attempts(user, ip_address):
    """
    Increment failed_attempts counter. Lock account when threshold is reached.
    Logs a 'lockout' event when lock is triggered.
    """
    max_attempts = int(os.environ.get('MAX_LOGIN_ATTEMPTS', 5))
    user.failed_attempts += 1

    if user.failed_attempts >= max_attempts and not user.is_locked:
        user.is_locked = True
        db.session.commit()
        log_auth_event(user.id, 'lockout', success=False, ip_address=ip_address, method='password')
    else:
        db.session.commit()


def reset_failed_attempts(user):
    """Zero out failed_attempts counter after a successful login."""
    user.failed_attempts = 0
    db.session.commit()
