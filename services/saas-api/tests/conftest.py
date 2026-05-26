import os
from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from saas_api.auth.passwords import hash_password, new_id
from saas_api.db.base import Base
from saas_api.db.models.account import Account, AccountRole, AccountStatus
from saas_api.db.models.tenant import Tenant, TenantStatus
from saas_api.db.models.tenant_config import ConfigKind, TenantConfig
from saas_api.db.models.tenant_member import TenantMember, TenantMemberRole
from saas_api.db.session import get_db, get_engine, get_session_factory, init_db, reset_engine
from saas_api.main import create_app
from saas_api.services.integration_service import ensure_default_integration_statuses
from saas_api.services.partner_service import seed_demo_partners
from saas_api.services.seed_builder import build_mystic_config, publish_config_copy
from saas_api.settings import settings


@pytest.fixture(scope="session", autouse=True)
def setup_test_db() -> Generator[None, None, None]:
    os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"
    os.environ["SAAS_SESSION_SECRET"] = "test-secret"
    reset_engine("sqlite+pysqlite:///:memory:")
    settings.database_url = "sqlite+pysqlite:///:memory:"
    settings.saas_session_secret = "test-secret"
    init_db()
    yield
    reset_engine()


@pytest.fixture()
def db() -> Generator[Session, None, None]:
    session = get_session_factory()()
    for table in reversed(Base.metadata.sorted_tables):
        session.execute(table.delete())
    session.commit()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture()
def seeded_db(db: Session) -> Session:
    from datetime import UTC, datetime

    now = datetime.now(UTC)
    admin = Account(
        id="account_admin",
        email="admin@example.com",
        password_hash=hash_password("admin123!"),
        role=AccountRole.PLATFORM_OWNER,
        status=AccountStatus.ACTIVE,
        created_at=now,
        updated_at=now,
    )
    blogger = Account(
        id="account_blogger",
        email="blogger@example.com",
        password_hash=hash_password("blogger123!"),
        role=AccountRole.BLOGGER_OWNER,
        status=AccountStatus.ACTIVE,
        partner_id="partner_nicole",
        created_at=now,
        updated_at=now,
    )
    platform_admin = Account(
        id="account_platform_admin",
        email="platform-admin@example.com",
        password_hash=hash_password("platformadmin123!"),
        role=AccountRole.PLATFORM_ADMIN,
        status=AccountStatus.ACTIVE,
        created_at=now,
        updated_at=now,
    )
    blogger_no_partner = Account(
        id="account_blogger_no_partner",
        email="blogger-nopartner@example.com",
        password_hash=hash_password("blogger123!"),
        role=AccountRole.BLOGGER_OWNER,
        status=AccountStatus.ACTIVE,
        created_at=now,
        updated_at=now,
    )
    viewer = Account(
        id="account_viewer",
        email="viewer@example.com",
        password_hash=hash_password("viewer123!"),
        role=AccountRole.BLOGGER_OWNER,
        status=AccountStatus.ACTIVE,
        partner_id="partner_nicole",
        created_at=now,
        updated_at=now,
    )
    db.add_all([admin, blogger, platform_admin, blogger_no_partner, viewer])

    tenant = Tenant(
        id="tenant_mystic",
        slug="mystic-dark",
        status=TenantStatus.ACTIVE,
        created_by_account_id=admin.id,
        created_at=now,
        updated_at=now,
    )
    db.add(tenant)
    db.add(
        TenantMember(
            id=new_id("tm"),
            tenant_id=tenant.id,
            account_id=blogger.id,
            role=TenantMemberRole.OWNER,
            created_at=now,
        )
    )
    db.add(
        TenantMember(
            id=new_id("tm"),
            tenant_id=tenant.id,
            account_id=blogger_no_partner.id,
            role=TenantMemberRole.OWNER,
            created_at=now,
        )
    )
    db.add(
        TenantMember(
            id=new_id("tm"),
            tenant_id=tenant.id,
            account_id=viewer.id,
            role=TenantMemberRole.VIEWER,
            created_at=now,
        )
    )

    draft = build_mystic_config()
    published = publish_config_copy(draft)
    db.add_all(
        [
            TenantConfig(
                id=new_id("cfg"),
                tenant_id=tenant.id,
                kind=ConfigKind.DRAFT,
                version=1,
                config_json=draft,
                created_at=now,
                updated_at=now,
            ),
            TenantConfig(
                id=new_id("cfg"),
                tenant_id=tenant.id,
                kind=ConfigKind.PUBLISHED,
                version=1,
                config_json=published,
                created_at=now,
                updated_at=now,
                published_at=now,
            ),
        ]
    )
    ensure_default_integration_statuses(db, tenant.id)
    seed_demo_partners(db, tenant.id)

    tenant2 = Tenant(
        id="tenant_other",
        slug="other-tenant",
        status=TenantStatus.ACTIVE,
        created_by_account_id=admin.id,
        created_at=now,
        updated_at=now,
    )
    db.add(tenant2)
    db.commit()
    return db


@pytest.fixture()
def client(seeded_db: Session) -> Generator[TestClient, None, None]:
    settings.app_env = "development"
    settings.allow_dev_telegram_auth = False
    settings.saas_cookie_secure = False
    settings.saas_session_secret = "test-secret"
    app = create_app()

    def override_get_db() -> Generator[Session, None, None]:
        yield seeded_db

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
