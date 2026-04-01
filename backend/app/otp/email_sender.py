"""
Brevo transactional email sender.

Uses the Brevo REST API (api.brevo.com/v3) — NOT smtplib / SMTP relay.
CRITICAL: smtp-relay.brevo.com is NOT on PythonAnywhere's free-tier whitelist.
          Only api.brevo.com is whitelisted. Always use this REST approach.

API key: https://app.brevo.com/settings/keys/api
Docs:    https://developers.brevo.com/docs/send-a-transactional-email
"""
import os
import requests


BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email'


def _send(recipient_email, recipient_name, subject, html_content, text_content):
    api_key = os.environ.get('BREVO_API_KEY')
    sender_email = os.environ.get('BREVO_SENDER_EMAIL')
    sender_name = os.environ.get('BREVO_SENDER_NAME', '2FA Platform')

    if not api_key or not sender_email:
        raise EnvironmentError('BREVO_API_KEY and BREVO_SENDER_EMAIL must be set in .env')

    response = requests.post(
        BREVO_API_URL,
        headers={
            'accept': 'application/json',
            'content-type': 'application/json',
            'api-key': api_key,
        },
        json={
            'sender': {'email': sender_email, 'name': sender_name},
            'to': [{'email': recipient_email, 'name': recipient_name or recipient_email}],
            'subject': subject,
            'htmlContent': html_content,
            'textContent': text_content,
        },
        timeout=10,
    )
    response.raise_for_status()
    return response.json()


def send_otp_email(recipient_email, recipient_name, otp_code, expiry_minutes=5):
    """Send a 6-digit OTP code via email."""
    subject = 'Your 2FA Verification Code'
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #1a1a2e;">Your Verification Code</h2>
      <p>Use the code below to complete your sign-in. It expires in {expiry_minutes} minutes.</p>
      <div style="background: #f4f4f4; border-radius: 8px; padding: 24px; text-align: center; margin: 24px 0;">
        <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #e8b83a;">{otp_code}</span>
      </div>
      <p style="color: #666; font-size: 13px;">
        If you did not request this code, ignore this email.
        Never share this code with anyone.
      </p>
    </div>
    """
    text = f'Your 2FA code is: {otp_code}\nExpires in {expiry_minutes} minutes.\nDo not share this code.'
    return _send(recipient_email, recipient_name, subject, html, text)


def send_reset_email(recipient_email, recipient_name, reset_url):
    """Send a password reset link."""
    subject = 'Reset Your Password'
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #1a1a2e;">Reset Your Password</h2>
      <p>Click the button below to reset your password. This link expires in 1 hour.</p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="{reset_url}"
           style="background: #e8b83a; color: #0a0d14; padding: 14px 28px;
                  border-radius: 6px; text-decoration: none; font-weight: bold;">
          Reset Password
        </a>
      </div>
      <p style="color: #666; font-size: 13px;">
        If you did not request a password reset, ignore this email.
        The link will expire automatically.
      </p>
    </div>
    """
    text = f'Reset your password: {reset_url}\nThis link expires in 1 hour.'
    return _send(recipient_email, recipient_name, subject, html, text)
