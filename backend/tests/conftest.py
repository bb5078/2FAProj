"""
pytest-flask configuration and shared fixtures.

IMPORTANT: always uses create_app('testing') so the SQLAlchemy engine is
bound to an in-memory SQLite from the very first call — not the production DB.
Updating config AFTER create_app() does NOT re-bind the engine, which is why
the previous approach accidentally wiped the real database.
"""
import pytest
from app import create_app
from app.extensions import db as _db


@pytest.fixture(scope='function')
def app():
    """Create a fresh Flask test app with an isolated in-memory database."""
    test_app = create_app('testing')

    with test_app.app_context():
        _db.create_all()
        yield test_app
        _db.session.remove()
        _db.drop_all()


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def db(app):
    yield _db
    _db.session.rollback()
