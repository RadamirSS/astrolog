import os
from datetime import UTC, datetime

from sqlalchemy.orm import Session

from saas_api.auth.passwords import hash_password, new_id
from saas_api.db.models.account import Account, AccountRole, AccountStatus
from saas_api.db.models.tenant import Tenant
from saas_api.db.models.tenant_config import ConfigKind, TenantConfig
from saas_api.db.models.tenant_member import TenantMember, TenantMemberRole
from saas_api.db.session import get_session_factory, init_db
from saas_api.services.integration_service import ensure_default_integration_statuses
from saas_api.services.partner_service import ensure_partner_from_config, seed_demo_partners
from saas_api.services.seed_builder import DEMO_TENANTS, publish_config_copy
from saas_api.settings import settings


def _upsert_account(
    db: Session,
    *,
    account_id: str,
    email: str,
    password: str,
    role: str,
) -> Account:
    account = db.query(Account).filter(Account.email == email).first()
    now = datetime.now(UTC)
    if account:
        account.password_hash = hash_password(password)
        account.role = role
        account.status = AccountStatus.ACTIVE
        account.updated_at = now
        return account
    account = Account(
        id=account_id,
        email=email,
        password_hash=hash_password(password),
        role=role,
        status=AccountStatus.ACTIVE,
        created_at=now,
        updated_at=now,
    )
    db.add(account)
    return account


def _upsert_tenant_with_configs(
    db: Session,
    *,
    tenant_id: str,
    slug: str,
    status: str,
    draft_config: dict,
    published_config: dict,
    blogger_account: Account,
    admin_account: Account,
) -> None:
    now = datetime.now(UTC)
    tenant = db.get(Tenant, tenant_id)
    if not tenant:
        tenant = Tenant(
            id=tenant_id,
            slug=slug,
            status=status,
            created_by_account_id=admin_account.id,
            created_at=now,
            updated_at=now,
        )
        db.add(tenant)
    else:
        tenant.status = status
        tenant.updated_at = now

    member = (
        db.query(TenantMember)
        .filter(TenantMember.tenant_id == tenant_id, TenantMember.account_id == blogger_account.id)
        .first()
    )
    if not member:
        db.add(
            TenantMember(
                id=new_id("tm"),
                tenant_id=tenant_id,
                account_id=blogger_account.id,
                role=TenantMemberRole.OWNER,
                created_at=now,
            )
        )

    for kind, config, version in (
        (ConfigKind.DRAFT, draft_config, draft_config.get("version", 1)),
        (ConfigKind.PUBLISHED, published_config, published_config.get("version", 1)),
    ):
        row = (
            db.query(TenantConfig)
            .filter(TenantConfig.tenant_id == tenant_id, TenantConfig.kind == kind)
            .first()
        )
        pub_at = None
        if kind == ConfigKind.PUBLISHED:
            pub_at = now
        if row:
            row.config_json = config
            row.version = version
            row.updated_at = now
            if pub_at:
                row.published_at = pub_at
        else:
            db.add(
                TenantConfig(
                    id=new_id("cfg"),
                    tenant_id=tenant_id,
                    kind=kind,
                    version=version,
                    config_json=config,
                    created_at=now,
                    updated_at=now,
                    published_at=pub_at,
                )
            )

    ensure_default_integration_statuses(db, tenant_id)


def _env(name: str, default: str) -> str:
    value = os.environ.get(name, default).strip()
    return value or default


def print_pilot_summary() -> None:
    miniapp_base = _env("NEXT_PUBLIC_MINIAPP_URL", "http://localhost:3000")
    dashboard_base = _env("NEXT_PUBLIC_DASHBOARD_URL", "http://localhost:3001")
    superadmin_base = _env("NEXT_PUBLIC_SUPERADMIN_URL", "http://localhost:3002")
    saas_base = _env("NEXT_PUBLIC_API_BASE_URL", "http://localhost:8000")
    astro_base = _env("ASTRO_API_BASE_URL", "http://localhost:8100")

    print("")
    print("Pilot URLs:")
    print(f"  SaaS API health:  {saas_base}/health")
    print(f"  SaaS API ready:   {saas_base}/ready")
    print(f"  Astro API health: {astro_base}/health")
    print(f"  Dashboard login:  {dashboard_base}")
    print(f"  Superadmin:       {superadmin_base}")
    print("")
    print("Demo tenants:")
    for demo in DEMO_TENANTS:
        slug = demo["slug"]
        tenant_id = demo["id"]
        print(f"  - {slug}")
        print(f"      Mini App:   {miniapp_base}/t/{slug}")
        print(f"      Dashboard:  {dashboard_base}?tenantId={tenant_id}")
        print(f"      Public API: {saas_base}/api/tenant/{slug}/config")
    print("")


def run_seed() -> None:
    init_db()
    db = get_session_factory()()
    try:
        admin = _upsert_account(
            db,
            account_id="account_admin",
            email=settings.saas_bootstrap_admin_email,
            password=settings.saas_bootstrap_admin_password,
            role=AccountRole.PLATFORM_OWNER,
        )
        blogger = _upsert_account(
            db,
            account_id="account_blogger",
            email=settings.saas_bootstrap_blogger_email,
            password=settings.saas_bootstrap_blogger_password,
            role=AccountRole.BLOGGER_OWNER,
        )

        for demo in DEMO_TENANTS:
            draft = demo["build_config"]()
            published = publish_config_copy(draft)
            _upsert_tenant_with_configs(
                db,
                tenant_id=demo["id"],
                slug=demo["slug"],
                status=demo["status"],
                draft_config=draft,
                published_config=published,
                blogger_account=blogger,
                admin_account=admin,
            )
            mini_app = published.get("miniApp") or {}
            brand = published.get("brand") or {}
            ensure_partner_from_config(db, demo["id"], mini_app, brand=brand)
            seed_demo_partners(db, demo["id"])

        db.commit()
        print("Seed completed successfully.")
        print(f"  Platform owner: {settings.saas_bootstrap_admin_email}")
        print(f"  Blogger owner:  {settings.saas_bootstrap_blogger_email}")
        print(f"  Demo tenants:   {', '.join(d['slug'] for d in DEMO_TENANTS)}")
        print_pilot_summary()
    finally:
        db.close()


if __name__ == "__main__":
    run_seed()
