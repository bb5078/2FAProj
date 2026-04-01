"""
Tests for /api/auth/* endpoints.
Covers: register, login, logout, /me, brute-force lockout.
"""
import json
import pytest
from app.models import User
from app.extensions import db, bcrypt


def post_json(client, url, data):
    return client.post(url, data=json.dumps(data), content_type='application/json')


# ── Register ──────────────────────────────────────────────────────────────────

class TestRegister:
    def test_register_success(self, client, db):
        res = post_json(client, '/api/auth/register', {
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'SecurePass123!',
        })
        data = res.get_json()
        assert res.status_code == 201
        assert data['success'] is True

    def test_register_duplicate_email(self, client, db):
        post_json(client, '/api/auth/register', {
            'username': 'user1',
            'email': 'dup@example.com',
            'password': 'SecurePass123!',
        })
        res = post_json(client, '/api/auth/register', {
            'username': 'user2',
            'email': 'dup@example.com',
            'password': 'SecurePass123!',
        })
        assert res.status_code == 409

    def test_register_short_password(self, client, db):
        res = post_json(client, '/api/auth/register', {
            'username': 'shortpass',
            'email': 'short@example.com',
            'password': '1234',
        })
        assert res.status_code == 400

    def test_password_stored_as_hash(self, client, db):
        """Plaintext password must never be stored."""
        post_json(client, '/api/auth/register', {
            'username': 'hashcheck',
            'email': 'hash@example.com',
            'password': 'PlainText123!',
        })
        user = User.query.filter_by(email='hash@example.com').first()
        assert user is not None
        assert user.password_hash != 'PlainText123!'
        assert bcrypt.check_password_hash(user.password_hash, 'PlainText123!')


# ── Login ─────────────────────────────────────────────────────────────────────

class TestLogin:
    @pytest.fixture(autouse=True)
    def setup_user(self, client, db):
        post_json(client, '/api/auth/register', {
            'username': 'loginuser',
            'email': 'login@example.com',
            'password': 'ValidPass123!',
        })

    def test_login_valid_credentials(self, client, db):
        res = post_json(client, '/api/auth/login', {
            'email': 'login@example.com',
            'password': 'ValidPass123!',
        })
        data = res.get_json()
        assert res.status_code == 200
        assert data['success'] is True
        assert data['requires_2fa'] is True

    def test_login_wrong_password(self, client, db):
        res = post_json(client, '/api/auth/login', {
            'email': 'login@example.com',
            'password': 'WrongPassword!',
        })
        assert res.status_code == 401
        assert res.get_json()['success'] is False

    def test_login_nonexistent_user(self, client, db):
        res = post_json(client, '/api/auth/login', {
            'email': 'nobody@example.com',
            'password': 'SomePass123!',
        })
        assert res.status_code == 401

    def test_login_sets_cookie(self, client, db):
        res = post_json(client, '/api/auth/login', {
            'email': 'login@example.com',
            'password': 'ValidPass123!',
        })
        assert 'session_token' in res.headers.get('Set-Cookie', '')


# ── Brute Force Protection ────────────────────────────────────────────────────

class TestBruteForce:
    @pytest.fixture(autouse=True)
    def setup_user(self, client, db):
        post_json(client, '/api/auth/register', {
            'username': 'bruteuser',
            'email': 'brute@example.com',
            'password': 'SafePass123!',
        })

    def test_account_locks_after_max_attempts(self, client, db):
        """Account should lock after MAX_LOGIN_ATTEMPTS failed logins."""
        for _ in range(5):
            post_json(client, '/api/auth/login', {
                'email': 'brute@example.com',
                'password': 'WrongPassword!',
            })

        user = User.query.filter_by(email='brute@example.com').first()
        assert user.is_locked is True

    def test_locked_account_returns_423(self, client, db):
        """Locked account must return 423 even with correct credentials."""
        for _ in range(5):
            post_json(client, '/api/auth/login', {
                'email': 'brute@example.com',
                'password': 'WrongPassword!',
            })

        res = post_json(client, '/api/auth/login', {
            'email': 'brute@example.com',
            'password': 'SafePass123!',
        })
        assert res.status_code == 423


# ── Auth Logs ─────────────────────────────────────────────────────────────────

class TestAuthLogs:
    def test_login_events_written_to_auth_logs(self, client, db):
        """Every login attempt must be written to auth_logs."""
        from app.models import AuthLog
        post_json(client, '/api/auth/register', {
            'username': 'logtest',
            'email': 'logtest@example.com',
            'password': 'LogPass123!',
        })
        post_json(client, '/api/auth/login', {
            'email': 'logtest@example.com',
            'password': 'LogPass123!',
        })
        logs = AuthLog.query.filter_by(event_type='login').all()
        assert len(logs) >= 1


# ── Password Reset ────────────────────────────────────────────────────────────

class TestPasswordReset:
    def test_reset_request_valid_email(self, client, db):
        """POST /api/auth/reset-request with valid email returns 200 success=True."""
        # First register a user
        post_json(client, '/api/auth/register', {
            'username': 'resetuser',
            'email': 'reset@example.com',
            'password': 'ResetPass123!',
        })

        res = post_json(client, '/api/auth/reset-request', {
            'email': 'reset@example.com',
        })
        data = res.get_json()
        assert res.status_code == 200
        assert data['success'] is True

    def test_reset_request_invalid_email(self, client, db):
        """POST /api/auth/reset-request with unknown email returns 200 (no enumeration)."""
        res = post_json(client, '/api/auth/reset-request', {
            'email': 'nonexistent@example.com',
        })
        data = res.get_json()
        # Should not reveal that email does not exist (security best practice)
        assert res.status_code == 200
        assert data['success'] is True

    def test_me_endpoint_authenticated(self, client, db):
        """GET /api/auth/me after register+login+2fa returns user data."""
        from app.models import TOTPSecret
        from cryptography.fernet import Fernet
        import os

        # Register user
        post_json(client, '/api/auth/register', {
            'username': 'meuser',
            'email': 'me@example.com',
            'password': 'MePass123!',
        })

        # Setup TOTP for this user so /login will trigger 2FA
        user = User.query.filter_by(email='me@example.com').first()
        key = os.environ.get('TOTP_ENCRYPTION_KEY', Fernet.generate_key().decode())
        cipher = Fernet(key.encode() if isinstance(key, str) else key)
        import pyotp
        secret = pyotp.random_base32()
        encrypted_secret = cipher.encrypt(secret.encode()).decode()

        totp_record = TOTPSecret(
            user_id=user.id,
            secret_encrypted=encrypted_secret,
            is_active=True,
        )
        db.session.add(totp_record)
        db.session.commit()

        # Login (will require TOTP)
        login_res = post_json(client, '/api/auth/login', {
            'email': 'me@example.com',
            'password': 'MePass123!',
        })
        assert login_res.status_code == 200

        # Verify TOTP code
        totp = pyotp.TOTP(secret)
        code = totp.now()
        verify_res = post_json(client, '/api/totp/verify', {
            'code': code,
        })
        assert verify_res.status_code == 200

        # Now /me should work
        res = client.get('/api/auth/me')
        assert res.status_code == 200
        data = res.get_json()
        assert data['success'] is True
        assert 'user' in data

    def test_me_endpoint_unauthenticated(self, client, db):
        """GET /api/auth/me without session returns 401."""
        res = client.get('/api/auth/me')
        assert res.status_code == 401
