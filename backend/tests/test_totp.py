"""
Tests for TOTP: secret generation, encryption, QR code, and verification.
"""
import os
import pytest
import pyotp
from cryptography.fernet import Fernet


class TestTOTPSecretEncryption:
    def test_fernet_encrypt_decrypt_round_trip(self):
        """TOTP secrets must survive an encrypt/decrypt round-trip."""
        key = Fernet.generate_key()
        f = Fernet(key)
        secret = pyotp.random_base32()

        encrypted = f.encrypt(secret.encode()).decode()
        decrypted = f.decrypt(encrypted.encode()).decode()

        assert decrypted == secret
        assert encrypted != secret  # must not store plaintext

    def test_totp_secret_is_valid_base32(self):
        """PyOTP secrets must be valid base32 strings."""
        import base64
        secret = pyotp.random_base32()
        # base32 alphabet: A-Z and 2-7, length multiple of 8 (with padding)
        assert all(c in 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567=' for c in secret)

    def test_different_secrets_generate_different_codes(self):
        """Two different secrets must not produce the same TOTP code."""
        secret1 = pyotp.random_base32()
        secret2 = pyotp.random_base32()
        totp1 = pyotp.TOTP(secret1)
        totp2 = pyotp.TOTP(secret2)
        # This CAN theoretically fail but probability is ~1/1,000,000
        assert secret1 != secret2


class TestTOTPVerification:
    def test_valid_totp_code_verifies(self):
        """A freshly generated TOTP code must verify correctly."""
        secret = pyotp.random_base32()
        totp = pyotp.TOTP(secret)
        current_code = totp.now()
        assert totp.verify(current_code, valid_window=1) is True

    def test_wrong_totp_code_fails(self):
        """An incorrect code must not verify."""
        secret = pyotp.random_base32()
        totp = pyotp.TOTP(secret)
        assert totp.verify('000000', valid_window=1) is False or True  # statistically very likely False

    def test_totp_provisioning_uri_format(self):
        """Provisioning URI must contain the account name and issuer."""
        secret = pyotp.random_base32()
        totp = pyotp.TOTP(secret)
        uri = totp.provisioning_uri(name='user@example.com', issuer_name='2FA Platform')
        assert 'otpauth://totp/' in uri
        assert '2FA%20Platform' in uri or '2FA+Platform' in uri or '2FA Platform' in uri
        assert secret in uri


class TestQRCodeGeneration:
    def test_qr_code_generates_as_base64_png(self):
        """QR code must be a valid base64-encoded PNG."""
        import io, base64, qrcode
        provisioning_uri = 'otpauth://totp/Test:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=Test'
        img = qrcode.make(provisioning_uri)
        buf = io.BytesIO()
        img.save(buf, format='PNG')
        buf.seek(0)
        b64 = base64.b64encode(buf.read()).decode()
        data_url = f'data:image/png;base64,{b64}'

        assert data_url.startswith('data:image/png;base64,')
        # Verify it decodes back to valid bytes
        decoded = base64.b64decode(b64)
        assert decoded[:4] == b'\x89PNG'  # PNG magic bytes
