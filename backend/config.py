import os
from dotenv import load_dotenv

load_dotenv()

# Build absolute path to the SQLite file — works regardless of which directory
# the process is launched from (Flask reloader, pytest, PythonAnywhere, etc.)
_backend_dir = os.path.dirname(os.path.abspath(__file__))
_instance_dir = os.path.join(_backend_dir, 'instance')
os.makedirs(_instance_dir, exist_ok=True)   # create instance/ if missing
_db_file = os.path.join(_instance_dir, '2fa.db')
# SQLite on Windows needs forward slashes in the URL
_default_db_url = 'sqlite:///' + _db_file.replace('\\', '/')


class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-change-in-production'

    _db_url = os.environ.get('DATABASE_URL', '').strip()
    SQLALCHEMY_DATABASE_URI = _db_url if _db_url else _default_db_url

    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Flask-Session: store sessions in the database
    SESSION_TYPE = 'sqlalchemy'
    SESSION_PERMANENT = False
    SESSION_USE_SIGNER = True
    SESSION_COOKIE_NAME = 'session'
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_PATH = '/'

    # Flask-WTF CSRF
    WTF_CSRF_ENABLED = True
    WTF_CSRF_TIME_LIMIT = 3600  # 1 hour
    # Frontend and backend are on different origins in production, so the
    # default strict same-origin referrer check breaks valid CSRF-protected
    # API requests coming from Netlify to PythonAnywhere over HTTPS.
    WTF_CSRF_SSL_STRICT = False

    # Auth settings
    OTP_EXPIRY_MINUTES = int(os.environ.get('OTP_EXPIRY_MINUTES', 5))
    MAX_LOGIN_ATTEMPTS = int(os.environ.get('MAX_LOGIN_ATTEMPTS', 5))
    SESSION_EXPIRY_MINUTES = int(os.environ.get('SESSION_EXPIRY_MINUTES', 30))


class DevelopmentConfig(Config):
    DEBUG = True
    SESSION_COOKIE_SECURE = False
    # Lax is correct for dev — both frontend (localhost:5173) and backend
    # (localhost:5000) share the same host, so SameSite=Lax works and the
    # browser won't reject cookies the way it does SameSite=None without Secure.
    SESSION_COOKIE_SAMESITE = 'Lax'


class ProductionConfig(Config):
    DEBUG = False
    # Required when SameSite=None (cross-domain Netlify <-> PythonAnywhere)
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_SAMESITE = 'None'


class TestingConfig(Config):
    TESTING = True
    DEBUG = False
    # Always use in-memory SQLite — completely isolated from production DB
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    WTF_CSRF_ENABLED = False
    SESSION_COOKIE_SECURE = False
    SESSION_COOKIE_SAMESITE = 'Lax'
    RATELIMIT_ENABLED = False


config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig,
}
