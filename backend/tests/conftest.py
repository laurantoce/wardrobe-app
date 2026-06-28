from __future__ import annotations

from collections.abc import Generator
from datetime import datetime, timezone
from types import SimpleNamespace

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.config import settings
from app.database import Base
from app.models import Garment, Outfit, User


@pytest.fixture(scope="session")
def db_engine():
    engine = create_engine(settings.database_url)
    Base.metadata.create_all(bind=engine)
    yield engine
    engine.dispose()


@pytest.fixture
def db_session(db_engine) -> Generator[Session, None, None]:
    connection = db_engine.connect()
    transaction = connection.begin()
    session_factory = sessionmaker(bind=connection, autoflush=False)
    session = session_factory()

    try:
        yield session
    finally:
        session.close()
        transaction.rollback()
        connection.close()


@pytest.fixture
def user(db_session: Session) -> User:
    user = User(email="test@example.com", password_hash="")
    db_session.add(user)
    db_session.flush()
    return user


def garment_factory(db_session: Session, user: User, **overrides) -> Garment:
    data = {
        "user_id": user.id,
        "name": "White Linen Shirt",
        "category": "top",
        "color_hex": "#ffffff",
        "color_name": "White",
        "purchase_price": None,
        "purchase_date": None,
        "material": [{"material": "linen", "pct": 100}],
    }
    data.update(overrides)
    garment = Garment(**data)
    db_session.add(garment)
    db_session.flush()
    return garment


def outfit_factory(
    db_session: Session,
    user: User,
    garments: list[Garment] | None = None,
    **overrides,
) -> Outfit:
    data = {
        "user_id": user.id,
        "name": "Work outfit",
        "season": "spring",
        "occasion": "work",
    }
    data.update(overrides)
    outfit = Outfit(**data)
    outfit.garments = garments or []
    db_session.add(outfit)
    db_session.flush()
    return outfit


@pytest.fixture
def make_garment(db_session: Session, user: User):
    def factory(**overrides) -> Garment:
        return garment_factory(db_session, user, **overrides)

    return factory


@pytest.fixture
def make_outfit(db_session: Session, user: User):
    def factory(garments: list[Garment] | None = None, **overrides) -> Outfit:
        return outfit_factory(db_session, user, garments, **overrides)

    return factory


@pytest.fixture
def api_user() -> SimpleNamespace:
    return SimpleNamespace(id=1, email="api@example.com", created_at=datetime.now(timezone.utc))
