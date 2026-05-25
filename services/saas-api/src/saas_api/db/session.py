from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from saas_api.db.base import Base
from saas_api.settings import settings

_engine = None
_SessionLocal = None


def get_engine():
    global _engine
    if _engine is None:
        connect_args = {}
        engine_kwargs: dict = {}
        if settings.database_url.startswith("sqlite"):
            connect_args["check_same_thread"] = False
            if settings.database_url.endswith(":memory:"):
                from sqlalchemy.pool import StaticPool

                engine_kwargs["poolclass"] = StaticPool
        _engine = create_engine(
            settings.database_url,
            connect_args=connect_args,
            **engine_kwargs,
        )
    return _engine


def get_session_factory() -> sessionmaker[Session]:
    global _SessionLocal
    if _SessionLocal is None:
        _SessionLocal = sessionmaker(bind=get_engine(), autocommit=False, autoflush=False)
    return _SessionLocal


def init_db() -> None:
    Base.metadata.create_all(bind=get_engine())


def reset_engine(database_url: str | None = None) -> None:
    global _engine, _SessionLocal
    _engine = None
    _SessionLocal = None
    if database_url is not None:
        settings.database_url = database_url


def get_db() -> Generator[Session, None, None]:
    db = get_session_factory()()
    try:
        yield db
    finally:
        db.close()
