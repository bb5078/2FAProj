"""
TOTP blueprint — /api/totp/*

RFC 6238 compliant TOTP using PyOTP.
Secrets are encrypted at rest with Fernet (key from .env).

Endpoints:
  GET  /api/totp/setup   — generate secret, return QR code + manual key
  POST /api/totp/verify  — verify a 6-digit TOTP code, activate setup
"""
import os
import io
import base64

import pyotp
import qrcode
from cryptography.fernet import Fernet

from flask import Blueprint, request, jsonify, make_response, current_app

from app.extensions import db, limiter
from app.models import TOTPSecret, User
from app.session.manager import (
    validate_session, upgrade_session,
    get_token_from_request, set_session_cookie,
)
from app.security.guards import log_auth_event

totp_bp = Blueprint('totp', __name__)


def _get_ip():
    return request.remote_addr


def _get_fernet():
    key = os.environ.get('TOTP_ENCRYPTION_KEY')
    if not key:
        raise EnvironmentError('TOTP_ENCRYPTION_KEY must be set in .env')
    return Fernet(key.encode())


def _encrypt_secret(secret):
    return _get_fernet().encrypt(secret.encode()).decode()


def _decrypt_secret(encrypted):
    return _get_fernet().decrypt(encrypted.encode()).decode()


def _make_qr_base64(provisioning_uri):
    """Generate a QR code PNG and return it as a base64 data URL."""
    img = qrcode.make(provisioning_uri)
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)
    b64 = base64.b64encode(buffer.read()).decode()
    return f'data:image/png;base64,{b64}'


# ── Setup ─────────────────────────────────────────────────────────────────────

@totp_bp.get('/setup')
@limiter.limit('10 per minute')
def setup():
    token = get_token_from_request()
    # Allow partial-auth session (user just logged in with password)
    session = validate_session(token, require_full_auth=False)

    if not session:
        return jsonify({'success': False, 'message': 'Not authenticated.'}), 401

    user = User.query.get(session.user_id)
    if not user:
        return jsonify({'success': False, 'message': 'User not found.'}), 401

    # Deactivate any existing inactive TOTP secrets for this user
    TOTPSecret.query.filter_by(user_id=user.id, is_active=False).delete()
    db.session.commit()

    # Generate a new TOTP secret
    secret = pyotp.random_base32()
    encrypted_secret = _encrypt_secret(secret)

    totp_record = TOTPSecret(
        user_id=user.id,
        secret_encrypted=encrypted_secret,
        is_active=False,  # not active until verified
    )
    db.session.add(totp_record)
    db.session.commit()

    # Build provisioning URI for QR code (compatible with Google Authenticator / Authy)
    app_name = '2FA Platform'
    totp = pyotp.TOTP(secret)
    provisioning_uri = totp.provisioning_uri(name=user.email, issuer_name=app_name)
    qr_base64 = _make_qr_base64(provisioning_uri)

    return jsonify({
        'success': True,
        'qr_code_base64': qr_base64,   # data:image/png;base64,...
        'manual_key': secret,           # shown as fallback for manual entry
        'provisioning_uri': provisioning_uri,
    })


# ── Verify ────────────────────────────────────────────────────────────────────

@totp_bp.post('/verify')
@limiter.limit('10 per minute')
def verify():
    token = get_token_from_request()
    session = validate_session(token, require_full_auth=False)

    if not session:
        return jsonify({'success': False, 'message': 'Not authenticated.'}), 401

    data = request.get_json(silent=True) or {}
    code = (data.get('code') or '').strip()

    if not code or len(code) != 6 or not code.isdigit():
        return jsonify({'success': False, 'message': 'Enter a valid 6-digit code.'}), 400

    # Get the most recent TOTP secret for this user (active or pending)
    totp_record = TOTPSecret.query.filter_by(
        user_id=session.user_id
    ).order_by(TOTPSecret.created_at.desc()).first()

    if not totp_record:
        return jsonify({'success': False, 'message': 'No TOTP setup found. Please start setup again.'}), 400

    try:
        secret = _decrypt_secret(totp_record.secret_encrypted)
    except Exception:
        current_app.logger.error('Failed to decrypt TOTP secret')
        return jsonify({'success': False, 'message': 'Internal error. Please try again.'}), 500

    totp = pyotp.TOTP(secret)
    # valid_window=1 allows 1 period (30s) drift on either side (RFC 6238 recommendation)
    if not totp.verify(code, valid_window=1):
        log_auth_event(session.user_id, 'totp_verify', success=False, ip_address=_get_ip(), method='totp')
        return jsonify({'success': False, 'message': 'Invalid code. Check your authenticator app.'}), 401

    # Activate the TOTP secret
    totp_record.is_active = True
    db.session.commit()

    # Upgrade session to fully authenticated
    new_token = upgrade_session(token)
    log_auth_event(session.user_id, 'totp_verify', success=True, ip_address=_get_ip(), method='totp')

    response = make_response(jsonify({
        'success': True,
        'message': 'TOTP verified. Access granted.',
    }))
    set_session_cookie(response, new_token)
    return response
