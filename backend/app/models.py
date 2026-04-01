"""
SQLAlchemy models — all 6 tables defined here.

Security rules (from CLAUDE.md §9):
- OTP codes stored as SHA-256 hashes, never plaintext
- TOTP secrets encrypted at rest with Fernet
- Sessions are server-side; referenced by cookie token
- failed_attempts increments on every bad login; lockout at threshold
- Every auth event written to auth_logs
"""
from datetime import datetime, timezone
from app.extensions import db


class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    phone = db.Column(db.String(20), nullable=True)
    is_locked = db.Column(db.Boolean, default=False, nullable=False)
    failed_attempts = db.Column(db.Integer, default=0, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    sessions = db.relationship('UserSession', backref='user', lazy=True, cascade='all, delete-orphan')
    otp_codes = db.relationship('OTPCode', backref='user', lazy=True, cascade='all, delete-orphan')
    totp_secrets = db.relationship('TOTPSecret', backref='user', lazy=True, cascade='all, delete-orphan')
    auth_logs = db.relationship('AuthLog', backref='user', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'username': self.username,
            'phone': self.phone,
            'is_locked': self.is_locked,
            'created_at': self.created_at.isoformat(),
        }


class UserSession(db.Model):
    """Server-side session tokens. Referenced by HttpOnly cookie."""
    __tablename__ = 'sessions'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    token = db.Column(db.String(64), unique=True, nullable=False, index=True)
    # pending_2fa = True means password verified but 2FA not yet completed
    is_fully_authenticated = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    expires_at = db.Column(db.DateTime, nullable=False)
    ip_address = db.Column(db.String(45), nullable=True)  # IPv6 max length


class OTPCode(db.Model):
    """Email and SMS OTP codes — stored as SHA-256 hashes only."""
    __tablename__ = 'otp_codes'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    code_hash = db.Column(db.String(64), nullable=False)  # SHA-256 hex digest
    method = db.Column(db.String(10), nullable=False)  # 'email' or 'sms'
    expires_at = db.Column(db.DateTime, nullable=False)
    is_used = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)


class TOTPSecret(db.Model):
    """TOTP secrets — encrypted at rest with Fernet (key in .env)."""
    __tablename__ = 'totp_secrets'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    secret_encrypted = db.Column(db.Text, nullable=False)  # Fernet-encrypted base32 secret
    is_active = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)


class AuthLog(db.Model):
    """Audit log — every auth event recorded here (pass AND fail)."""
    __tablename__ = 'auth_logs'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)  # nullable for failed logins
    timestamp = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)
    event_type = db.Column(db.String(30), nullable=False)  # 'register', 'login', 'logout', 'otp_send', 'otp_verify', 'totp_verify', 'lockout', 'reset_request'
    method = db.Column(db.String(10), nullable=True)  # 'password', 'email', 'sms', 'totp'
    success = db.Column(db.Boolean, nullable=False)
    ip_address = db.Column(db.String(45), nullable=True)


class AdminConfig(db.Model):
    """Key-value store for runtime configuration."""
    __tablename__ = 'admin_config'

    key = db.Column(db.String(80), primary_key=True)
    value = db.Column(db.Text, nullable=False)
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc),
                           onupdate=lambda: datetime.now(timezone.utc), nullable=False)
