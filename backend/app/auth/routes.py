"""
Auth blueprint — /api/auth/*

Endpoints:
  POST /api/auth/register
  POST /api/auth/login
  POST /api/auth/logout
  GET  /api/auth/me
  GET  /api/auth/csrf-token  (defined in __init__.py)
  POST /api/auth/reset-request
  POST /api/auth/reset-confirm
"""
import os
from datetime import datetime, timezone, timedelta

from flask import Blueprint, request, jsonify, make_response, current_app
from itsdangerous import URLSafeTimedSerializer, SignatureExpired, BadSignature

from app.extensions import db, bcrypt, limiter
from app.models import User
from app.session.manager import (
    create_session, validate_session, expire_session,
    get_token_from_request, set_session_cookie, clear_session_cookie,
)
from app.security.guards import (
    log_auth_event, check_account_locked,
    increment_failed_attempts, reset_failed_attempts,
)

auth_bp = Blueprint('auth', __name__)

# ── Helpers ──────────────────────────────────────────────────────────────────

def _get_serializer():
    return URLSafeTimedSerializer(current_app.config['SECRET_KEY'])


def _get_ip():
    return request.remote_addr


# ── Register ─────────────────────────────────────────────────────────────────

@auth_bp.post('/register')
@limiter.limit('5 per minute')
def register():
    data = request.get_json(silent=True) or {}
    username = (data.get('username') or '').strip()
    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''
    phone = (data.get('phone') or '').strip() or None

    # Basic validation
    if not username or not email or not password:
        return jsonify({'success': False, 'message': 'Username, email and password are required.'}), 400

    if len(password) < 8:
        return jsonify({'success': False, 'message': 'Password must be at least 8 characters.'}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({'success': False, 'message': 'An account with that email already exists.'}), 409

    if User.query.filter_by(username=username).first():
        return jsonify({'success': False, 'message': 'That username is already taken.'}), 409

    # bcrypt hash — cost factor 12 (NIST / OWASP recommendation)
    password_hash = bcrypt.generate_password_hash(password, rounds=12).decode('utf-8')

    user = User(
        username=username,
        email=email,
        password_hash=password_hash,
        phone=phone,
    )
    db.session.add(user)
    db.session.commit()

    log_auth_event(user.id, 'register', success=True, ip_address=_get_ip(), method='password')

    return jsonify({'success': True, 'message': 'Account created. Please sign in.'}), 201


# ── Login ─────────────────────────────────────────────────────────────────────

@auth_bp.post('/login')
@limiter.limit('10 per minute')
def login():
    data = request.get_json(silent=True) or {}
    identifier = (data.get('email') or '').strip().lower()  # email or username
    password = data.get('password') or ''

    if not identifier or not password:
        return jsonify({'success': False, 'message': 'Email and password are required.'}), 400

    # Find user by email or username
    user = User.query.filter_by(email=identifier).first() or \
           User.query.filter_by(username=identifier).first()

    if not user:
        # Don't reveal whether the account exists (OWASP)
        return jsonify({'success': False, 'message': 'Invalid credentials.'}), 401

    if check_account_locked(user):
        log_auth_event(user.id, 'login', success=False, ip_address=_get_ip(), method='password')
        return jsonify({
            'success': False,
            'message': 'Account is locked due to too many failed attempts. Contact support.',
            'locked': True,
        }), 423

    if not bcrypt.check_password_hash(user.password_hash, password):
        increment_failed_attempts(user, _get_ip())
        log_auth_event(user.id, 'login', success=False, ip_address=_get_ip(), method='password')
        remaining = max(0, int(os.environ.get('MAX_LOGIN_ATTEMPTS', 5)) - user.failed_attempts)
        return jsonify({
            'success': False,
            'message': f'Invalid credentials. {remaining} attempt(s) remaining before lockout.',
        }), 401

    # Credentials correct — reset counter
    reset_failed_attempts(user)
    log_auth_event(user.id, 'login', success=True, ip_address=_get_ip(), method='password')

    # Determine which 2FA method the user has set up
    from app.models import TOTPSecret
    totp_active = TOTPSecret.query.filter_by(user_id=user.id, is_active=True).first()

    # Create partial-auth session (2FA not yet completed)
    token = create_session(user.id, ip_address=_get_ip(), fully_authenticated=False)

    if totp_active:
        mfa_method = 'totp'
    elif user.phone:
        mfa_method = 'sms'
    else:
        mfa_method = 'email'

    response = make_response(jsonify({
        'success': True,
        'requires_2fa': True,
        'method': mfa_method,
        'user': {'email': user.email, 'username': user.username},
    }))
    set_session_cookie(response, token)
    return response


# ── Logout ───────────────────────────────────────────────────────────────────

@auth_bp.post('/logout')
def logout():
    token = get_token_from_request()
    user_id = None

    if token:
        session = validate_session(token, require_full_auth=False)
        if session:
            user_id = session.user_id
        expire_session(token)

    if user_id:
        log_auth_event(user_id, 'logout', success=True, ip_address=_get_ip())

    response = make_response(jsonify({'success': True, 'message': 'Logged out.'}))
    clear_session_cookie(response)
    return response


# ── Me ───────────────────────────────────────────────────────────────────────

@auth_bp.get('/me')
def me():
    token = get_token_from_request()
    session = validate_session(token, require_full_auth=True)

    if not session:
        return jsonify({'success': False, 'message': 'Not authenticated.'}), 401

    user = User.query.get(session.user_id)
    if not user:
        return jsonify({'success': False, 'message': 'User not found.'}), 401

    from app.models import TOTPSecret
    totp_active = TOTPSecret.query.filter_by(user_id=user.id, is_active=True).first()

    return jsonify({
        'success': True,
        'user': {
            **user.to_dict(),
            'totp_enabled': bool(totp_active),
        },
    })


# ── Password Reset Request ───────────────────────────────────────────────────

@auth_bp.post('/reset-request')
@limiter.limit('3 per minute')
def reset_request():
    data = request.get_json(silent=True) or {}
    email = (data.get('email') or '').strip().lower()

    if not email:
        return jsonify({'success': False, 'message': 'Email is required.'}), 400

    user = User.query.filter_by(email=email).first()

    # Always return success to prevent email enumeration (OWASP)
    if user:
        s = _get_serializer()
        token = s.dumps(user.email, salt='password-reset')

        # Send reset email via Brevo
        try:
            from app.otp.email_sender import send_reset_email
            reset_url = f"{os.environ.get('FRONTEND_URL', 'http://localhost:5173')}/reset-password?token={token}"
            send_reset_email(user.email, user.username, reset_url)
        except Exception as e:
            current_app.logger.error(f'Password reset email failed: {e}')

        log_auth_event(user.id, 'reset_request', success=True, ip_address=_get_ip(), method='email')

    return jsonify({'success': True, 'message': 'If an account exists, a reset link has been sent.'})


# ── Password Reset Confirm ───────────────────────────────────────────────────

# ── Set MFA Method (research/demo) ──────────────────────────────────────────

@auth_bp.post('/set-mfa-method')
def set_mfa_method():
    """
    Allow a logged-in user to switch their active 2FA method.
    Intended for research/demo: lets a single user test all three methods.
      - email : clear phone, deactivate all TOTP secrets
      - sms   : set phone number, deactivate all TOTP secrets
      - totp  : deactivate TOTP secrets (frontend will redirect to /mfa-setup)
    """
    token = get_token_from_request()
    session = validate_session(token, require_full_auth=True)
    if not session:
        return jsonify({'success': False, 'message': 'Not authenticated.'}), 401

    user = User.query.get(session.user_id)
    if not user:
        return jsonify({'success': False, 'message': 'User not found.'}), 401

    data = request.get_json(silent=True) or {}
    method = (data.get('method') or '').strip().lower()
    phone = (data.get('phone') or '').strip() or None

    if method not in ('email', 'sms', 'totp'):
        return jsonify({'success': False, 'message': 'method must be email, sms, or totp.'}), 400

    if method == 'sms' and not phone:
        return jsonify({'success': False, 'message': 'Phone number required for SMS method.'}), 400

    from app.models import TOTPSecret

    if method == 'email':
        user.phone = None
        TOTPSecret.query.filter_by(user_id=user.id).update({'is_active': False})

    elif method == 'sms':
        user.phone = phone
        TOTPSecret.query.filter_by(user_id=user.id).update({'is_active': False})

    elif method == 'totp':
        # Just deactivate existing TOTP so /mfa-setup generates a fresh secret
        TOTPSecret.query.filter_by(user_id=user.id).update({'is_active': False})

    db.session.commit()
    log_auth_event(user.id, 'mfa_method_change', success=True, ip_address=_get_ip(), method=method)

    return jsonify({'success': True, 'method': method,
                    'message': f'2FA method switched to {method}.'})


@auth_bp.post('/reset-confirm')
@limiter.limit('5 per minute')
def reset_confirm():
    data = request.get_json(silent=True) or {}
    token = data.get('token') or ''
    new_password = data.get('password') or ''

    if not token or not new_password:
        return jsonify({'success': False, 'message': 'Token and new password are required.'}), 400

    if len(new_password) < 8:
        return jsonify({'success': False, 'message': 'Password must be at least 8 characters.'}), 400

    try:
        s = _get_serializer()
        email = s.loads(token, salt='password-reset', max_age=3600)  # 1 hour expiry
    except SignatureExpired:
        return jsonify({'success': False, 'message': 'Reset link has expired.'}), 400
    except BadSignature:
        return jsonify({'success': False, 'message': 'Invalid or tampered reset link.'}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'success': False, 'message': 'User not found.'}), 400

    user.password_hash = bcrypt.generate_password_hash(new_password, rounds=12).decode('utf-8')
    user.is_locked = False  # Unlock account on successful reset
    user.failed_attempts = 0
    db.session.commit()

    log_auth_event(user.id, 'reset_confirm', success=True, ip_address=_get_ip(), method='password')

    return jsonify({'success': True, 'message': 'Password updated successfully. Please sign in.'})
