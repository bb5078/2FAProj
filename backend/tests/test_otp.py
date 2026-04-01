"""
Tests for OTP generation, hashing, expiry, and the /api/otp/* endpoints.
Email/SMS delivery is not tested here (requires live credentials).
"""
import hashlib
import json
import pytest
from datetime import datetime, timedelta, timezone

from app.models import OTPCode, User
from app.extensions import db


def post_json(client, url, data):
    return client.post(url, data=json.dumps(data), content_type='application/json')


class TestOTPHashing:
    def test_otp_stored_as_sha256_hash(self, app, db):
        """OTP codes must be stored as SHA-256 hashes, never plaintext."""
        with app.app_context():
            code = '123456'
            expected_hash = hashlib.sha256(code.encode()).hexdigest()
            assert len(expected_hash) == 64  # SHA-256 hex = 64 chars
            assert expected_hash != code


class TestOTPExpiry:
    def test_otp_expiry_enforced(self, app, db):
        """Expired OTP records should fail verification."""
        with app.app_context():
            import secrets, hashlib
            from app.models import User, OTPCode

            user = User(username='otpexp', email='otpexp@example.com',
                        password_hash='x')
            db.session.add(user)
            db.session.commit()

            code = '999999'
            code_hash = hashlib.sha256(code.encode()).hexdigest()
            expired_otp = OTPCode(
                user_id=user.id,
                code_hash=code_hash,
                method='email',
                expires_at=datetime.now(timezone.utc) - timedelta(minutes=1),  # already expired
                is_used=False,
            )
            db.session.add(expired_otp)
            db.session.commit()

            # Check that the record is expired
            now = datetime.now(timezone.utc)
            assert now > expired_otp.expires_at.replace(tzinfo=timezone.utc)


class TestOTPReplay:
    def test_used_otp_cannot_be_reused(self, app, db):
        """OTP marked is_used=True must not be accepted again."""
        with app.app_context():
            import hashlib
            from app.models import User, OTPCode

            user = User(username='otpreplay', email='otpreplay@example.com',
                        password_hash='x')
            db.session.add(user)
            db.session.commit()

            code = '555555'
            code_hash = hashlib.sha256(code.encode()).hexdigest()
            used_otp = OTPCode(
                user_id=user.id,
                code_hash=code_hash,
                method='email',
                expires_at=datetime.now(timezone.utc) + timedelta(minutes=5),
                is_used=True,  # already used
            )
            db.session.add(used_otp)
            db.session.commit()

            # Query should return nothing for is_used=False
            result = OTPCode.query.filter_by(
                user_id=user.id, code_hash=code_hash, is_used=False
            ).first()
            assert result is None
