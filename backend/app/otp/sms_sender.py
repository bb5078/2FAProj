"""
Twilio SMS sender.

Credentials in .env:
  TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER

Docs: https://www.twilio.com/docs/sms/quickstart/python

Note: Twilio trial accounts can only send to verified phone numbers.
      Upgrade to a paid account for unrestricted delivery.
      Twilio is confirmed on PythonAnywhere's free-tier whitelist.
"""
import os
from twilio.rest import Client


def send_otp_sms(phone_number, otp_code, expiry_minutes=5):
    """Send a 6-digit OTP via SMS using Twilio."""
    account_sid = os.environ.get('TWILIO_ACCOUNT_SID')
    auth_token = os.environ.get('TWILIO_AUTH_TOKEN')
    from_number = os.environ.get('TWILIO_PHONE_NUMBER')

    if not all([account_sid, auth_token, from_number]):
        raise EnvironmentError('TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER must be set in .env')

    client = Client(account_sid, auth_token)
    message = client.messages.create(
        body=f'Your 2FA code is: {otp_code}\nExpires in {expiry_minutes} minutes.\nDo not share this code.',
        from_=from_number,
        to=phone_number,
    )
    return message.sid
