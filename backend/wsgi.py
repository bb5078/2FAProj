"""
PythonAnywhere WSGI entry point.

In the PythonAnywhere Web tab, set:
  Source code:  /home/YOURUSERNAME/2fa-platform/backend
  Working dir:  /home/YOURUSERNAME/2fa-platform/backend
  WSGI file:    /home/YOURUSERNAME/2fa-platform/backend/wsgi.py
  Virtualenv:   /home/YOURUSERNAME/.virtualenvs/2fa-env

Replace YOURUSERNAME with your actual PythonAnywhere username.
"""
import sys
import os

# Add the backend directory to sys.path
sys.path.insert(0, os.path.dirname(__file__))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

from app import create_app

application = create_app('production')
