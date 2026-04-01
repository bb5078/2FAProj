"""
Flask application factory.
Creates and configures the Flask app, initialises all extensions,
registers blueprints, and attaches security headers.
"""
import os
from flask import Flask, jsonify
from dotenv import load_dotenv

from app.extensions import db, bcrypt, limiter, cors, csrf
from config import config


def create_app(config_name=None):
    if config_name is None:
        config_name = os.environ.get('FLASK_ENV', 'development')
        if config_name not in config:
            config_name = 'default'

    load_dotenv()

    app = Flask(__name__)
    app.config.from_object(config[config_name])

    # ── Extensions ──────────────────────────────────────────────────────────
    db.init_app(app)
    bcrypt.init_app(app)
    csrf.init_app(app)

    frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:5173')
    cors.init_app(
        app,
        supports_credentials=True,
        origins=[frontend_url],
        allow_headers=['Content-Type', 'X-CSRFToken'],
        methods=['GET', 'POST', 'OPTIONS'],
    )

    limiter.init_app(app)

    # ── Blueprints ───────────────────────────────────────────────────────────
    from app.auth.routes import auth_bp
    from app.otp.routes import otp_bp
    from app.totp.routes import totp_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(otp_bp, url_prefix='/api/otp')
    app.register_blueprint(totp_bp, url_prefix='/api/totp')

    # ── Security headers ─────────────────────────────────────────────────────
    @app.after_request
    def set_security_headers(response):
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        if not app.debug:
            response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
        return response

    # ── Health check ─────────────────────────────────────────────────────────
    @app.get('/api/health')
    def health():
        return jsonify({'status': 'ok'})

    # ── CSRF token endpoint (React fetches this on app load) ─────────────────
    @app.get('/api/auth/csrf-token')
    def get_csrf_token():
        from flask_wtf.csrf import generate_csrf
        token = generate_csrf()
        response = jsonify({'csrf_token': token})
        return response

    # Create all tables if they don't exist yet
    with app.app_context():
        db.create_all()

    return app
