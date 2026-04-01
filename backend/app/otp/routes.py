"""
OTP blueprint — /api/otp/*

Endpoints:
  POST /api/otp/send    — generate & deliver OTP (email or SMS)
  POST /api/otp/verify  — verify submitted OTP code
"""
import os
import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from flask import Blueprint, request, jsonify, make_response, current_app

from app.extensions import db, limiter
from app.models import OTPCode, User
from app.session.manager import (
    validate_session, upgrade_session,
    get_token_from_request, set_session_cookie,
)
from app.security.guards import log_auth_event

otp_bp = Blueprint('otp', __name__)


def _get_ip():
    return request.remote_addr


def _hash_code(code):
    """SHA-256 hash of the OTP. Codes stored as hashes only."""
    return hashlib.sha256(code.encode('utf-8')).hexdigest()


def _generate_otp():
    """Generate a cryptographically secure 6-digit OTP."""
    return str(secrets.randbelow(900000) + 100000)  # 100000–999999


# ── Send OTP ─────────────────────────────────────────────────────────────────

@otp_bp.post('/send')
@limiter.limit('3 per minute')
def send_otp():
    token = get_token_from_request()
    session = validate_session(token, require_full_auth=False)

    if not session:
        return jsonify({'success': False, 'message': 'Not authenticated. Please sign in first.'}), 401

    user = User.query.get(session.user_id)
    if not user:
        return jsonify({'success': False, 'message': 'User not found.'}), 401

    data = request.get_json(silent=True) or {}
    method = data.get('method', 'email')  # 'email' or 'sms'

    if method not in ('email', 'sms'):
        return jsonify({'success': False, 'message': 'method must be "email" or "sms".'}), 400

    if method == 'sms' and not user.phone:
        return jsonify({'success': False, 'message': 'No phone number on file. Use email OTP.'}), 400

    # Invalidate any previous unused OTP for this user+method
    OTPCode.query.filter_by(
        user_id=user.id, method=method, is_used=False
    ).update({'is_used': True})
    db.session.commit()

    expiry_minutes = int(os.environ.get('OTP_EXPIRY_MINUTES', 5))
    code = _generate_otp()
    code_hash = _hash_code(code)
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=expiry_minutes)

    otp_record = OTPCode(
        user_id=user.id,
        code_hash=code_hash,
        method=method,
        expires_at=expires_at,
    )
    db.session.add(otp_record)
    db.session.commit()

    # Deliver
    try:
        if method == 'email':
            from app.otp.email_sender import send_otp_email
            send_otp_email(user.email, user.username, code, expiry_minutes)
        else:
            from app.otp.sms_sender import send_otp_sms
            send_otp_sms(user.phone, code, expiry_minutes)
    except Exception as e:
        current_app.logger.error(f'OTP delivery failed [{method}]: {e}')
        return jsonify({'success': False, 'message': f'Failed to send OTP via {method}. Please try again.'}), 500

    log_auth_event(user.id, 'otp_send', success=True, ip_address=_get_ip(), method=method)

    return jsonify({
        'success': True,
        'method': method,
        'expires_in': expiry_minutes * 60,
        'message': f'OTP sent via {method}.',
    })


# ── Verify OTP ────────────────────────────────────────────────────────────────

@otp_bp.post('/verify')
@limiter.limit('10 per minute')
def verify_otp():
    token = get_token_from_request()
    session = validate_session(token, require_full_auth=False)

    if not session:
        return jsonify({'success': False, 'message': 'Not authenticated.'}), 401

    data = request.get_json(silent=True) or {}
    code = (data.get('code') or '').strip()

    if not code or len(code) != 6 or not code.isdigit():
        return jsonify({'success': False, 'message': 'Enter a valid 6-digit code.'}), 400

    code_hash = _hash_code(code)
    now = datetime.now(timezone.utc)

    # Find a matching, unexpired, unused OTP for this user
    otp_record = OTPCode.query.filter_by(
        user_id=session.user_id,
        code_hash=code_hash,
        is_used=False,
    ).first()

    if not otp_record:
        log_auth_event(session.user_id, 'otp_verify', success=False, ip_address=_get_ip())
        return jsonify({'success': False, 'message': 'Invalid code.'}), 401

    if now > otp_record.expires_at.replace(tzinfo=timezone.utc):
        log_auth_event(session.user_id, 'otp_verify', success=False, ip_address=_get_ip())
        return jsonify({'success': False, 'message': 'Code has expired. Request a new one.'}), 401

    # Mark as used immediately (prevents replay)
    otp_record.is_used = True
    db.session.commit()

    # Upgrade session to fully authenticated
    new_token = upgrade_session(token)
    log_auth_event(session.user_id, 'otp_verify', success=True, ip_address=_get_ip(), method=otp_record.method)

    response = make_response(jsonify({
        'success': True,
        'message': '2FA verified. Access granted.',
    }))
    set_session_cookie(response, new_token)
    return response
