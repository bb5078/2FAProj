#!/usr/bin/env python
"""
One-time database initialization script.
Run this once to create all 6 tables.
"""
import os
import sys

# Ensure we're in the right directory context
os.chdir(os.path.dirname(os.path.abspath(__file__)))

from app import create_app

app = create_app('development')

with app.app_context():
    from app.extensions import db
    db.create_all()
    print('[OK] Database initialized with 6 tables:')
    print('     - users')
    print('     - user_sessions')
    print('     - otp_codes')
    print('     - totp_secrets')
    print('     - auth_logs')
    print('     - admin_config')
