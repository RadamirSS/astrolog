from copy import deepcopy
from datetime import UTC, datetime
from typing import Any

from backend_common.errors import ApiErrorCode, AppError
from saas_api.auth.dependencies import is_platform_admin
from saas_api.auth.passwords import new_id
from saas_api.db.models.account import Account
from saas_api.db.models.tenant import Tenant, TenantStatus
from saas_api.db.models.tenant_config import ConfigKind, TenantConfig
from saas_api.db.models.tenant_member import TenantMember, TenantMemberRole
from saas_api.services.audit_service import log_action
from saas_api.services.config_diff import build_config_status
from saas_api.services.config_validation import validate_tenant_config
from saas_api.services.integration_service import ensure_default_integration_statuses, get_integration_statuses_dict
from saas_api.services.seed_builder import create_default_tenant_config


def _utc_now_iso() -> str:
    return datetime.now(UTC).isoformat().replace("+00:00", "Z")


def _get_tenant_or_404(db, tenant_id: str) -> Tenant:
    tenant = db.get(Tenant, tenant_id)
    if not tenant:
        raise AppError(ApiErrorCode.NOT_FOUND, "Tenant not found", status_code=404)
    return tenant


def _get_config_row(db, tenant_id: str, kind: str) -> TenantConfig | None:
    return (
        db.query(TenantConfig)
        .filter(TenantConfig.tenant_id == tenant_id, TenantConfig.kind == kind)
        .first()
    )


def _count_active_products(products: list[dict]) -> int:
    return sum(1 for p in products if p.get("status") == "active")


def _count_enabled_modules(modules: dict) -> int:
    keys = ["onboarding", "freeReport", "products", "profile"]
    return sum(1 for k in keys if modules.get(k))


def _owner_email(db, tenant_id: str) -> str:
    member = (
        db.query(TenantMember)
        .join(TenantMember.account)
        .filter(TenantMember.tenant_id == tenant_id, TenantMember.role == TenantMemberRole.OWNER)
        .first()
    )
    if member and member.account:
        return member.account.email
    return "unknown@astro.local"


def build_tenant_list_item(db, tenant: Tenant) -> dict[str, Any]:
    draft_row = _get_config_row(db, tenant.id, ConfigKind.DRAFT)
    published_row = _get_config_row(db, tenant.id, ConfigKind.PUBLISHED)
    draft = draft_row.config_json if draft_row else {}
    published = published_row.config_json if published_row else None
    owner = _owner_email(db, tenant.id)
    return {
        "id": tenant.id,
        "slug": tenant.slug,
        "displayName": draft.get("brand", {}).get("displayName", tenant.slug),
        "status": tenant.status,
        "ownerEmail": owner,
        "createdAt": tenant.created_at.isoformat().replace("+00:00", "Z"),
        "updatedAt": tenant.updated_at.isoformat().replace("+00:00", "Z"),
        "brandSummary": {
            "displayName": draft.get("brand", {}).get("displayName", tenant.slug),
            "tagline": draft.get("brand", {}).get("tagline"),
            "avatarUrl": draft.get("brand", {}).get("avatarUrl"),
        },
        "themePreset": draft.get("theme", {}).get("preset", "cosmic-violet"),
        "activeProductCount": _count_active_products(draft.get("products", [])),
        "enabledModuleCount": _count_enabled_modules(draft.get("modules", {})),
        "lastSavedDraftAt": (draft.get("meta") or {}).get("updatedAt"),
        "lastPublishedAt": (published or {}).get("publishedAt"),
        "hasPublished": published is not None,
        "integrationStatuses": get_integration_statuses_dict(db, tenant.id),
    }


def list_tenants_for_account(db, account: Account) -> list[dict[str, Any]]:
    if is_platform_admin(account):
        tenants = db.query(Tenant).order_by(Tenant.created_at).all()
    else:
        tenant_ids = [
            m.tenant_id
            for m in db.query(TenantMember).filter(TenantMember.account_id == account.id).all()
        ]
        tenants = db.query(Tenant).filter(Tenant.id.in_(tenant_ids)).order_by(Tenant.created_at).all()
    return [build_tenant_list_item(db, t) for t in tenants]


def get_tenant_detail(db, tenant_id: str) -> dict[str, Any]:
    tenant = _get_tenant_or_404(db, tenant_id)
    return build_tenant_list_item(db, tenant)


def create_tenant(
    db,
    *,
    slug: str,
    display_name: str,
    preset: str,
    owner_email: str | None,
    actor: Account,
) -> dict[str, Any]:
    existing = db.query(Tenant).filter(Tenant.slug == slug).first()
    if existing:
        raise AppError(
            ApiErrorCode.VALIDATION_ERROR,
            "Slug already exists",
            status_code=422,
        )

    tenant_id = f"tenant_{slug.replace('-', '_')}"
    now = datetime.now(UTC)
    tenant = Tenant(
        id=tenant_id,
        slug=slug,
        status=TenantStatus.DRAFT,
        created_by_account_id=actor.id,
        created_at=now,
        updated_at=now,
    )
    db.add(tenant)

    draft_config = create_default_tenant_config(tenant_id, slug, display_name, preset)
    draft_config["status"] = "draft"
    draft_config["version"] = 0
    db.add(
        TenantConfig(
            id=new_id("cfg"),
            tenant_id=tenant_id,
            kind=ConfigKind.DRAFT,
            version=0,
            config_json=draft_config,
            created_at=now,
            updated_at=now,
        )
    )
    ensure_default_integration_statuses(db, tenant_id)

    if owner_email:
        owner = db.query(Account).filter(Account.email == owner_email).first()
        if owner:
            db.add(
                TenantMember(
                    id=new_id("tm"),
                    tenant_id=tenant_id,
                    account_id=owner.id,
                    role=TenantMemberRole.OWNER,
                    created_at=now,
                )
            )

    log_action(db, action="tenant_created", actor_account_id=actor.id, tenant_id=tenant_id, payload={"slug": slug})
    db.commit()
    db.refresh(tenant)
    return {
        "id": tenant.id,
        "slug": tenant.slug,
        "displayName": display_name,
        "status": tenant.status,
        "ownerEmail": owner_email or f"{slug}@demo.astrology.app",
        "createdAt": tenant.created_at.isoformat().replace("+00:00", "Z"),
        "updatedAt": tenant.updated_at.isoformat().replace("+00:00", "Z"),
    }


def set_tenant_status(db, tenant_id: str, status: str, actor: Account) -> dict[str, Any]:
    tenant = _get_tenant_or_404(db, tenant_id)
    if status not in {TenantStatus.DRAFT, TenantStatus.ACTIVE, TenantStatus.PAUSED}:
        raise AppError(ApiErrorCode.VALIDATION_ERROR, "Invalid tenant status", status_code=422)
    old_status = tenant.status
    tenant.status = status
    tenant.updated_at = datetime.now(UTC)

    draft_row = _get_config_row(db, tenant.id, ConfigKind.DRAFT)
    if draft_row:
        config = deepcopy(draft_row.config_json)
        config["status"] = status
        draft_row.config_json = config
        draft_row.updated_at = datetime.now(UTC)

    published_row = _get_config_row(db, tenant.id, ConfigKind.PUBLISHED)
    if published_row:
        config = deepcopy(published_row.config_json)
        config["status"] = status
        published_row.config_json = config
        published_row.updated_at = datetime.now(UTC)

    log_action(
        db,
        action="tenant_status_changed",
        actor_account_id=actor.id,
        tenant_id=tenant_id,
        payload={"from": old_status, "to": status},
    )
    db.commit()
    db.refresh(tenant)
    return {
        "id": tenant.id,
        "slug": tenant.slug,
        "displayName": draft_row.config_json.get("brand", {}).get("displayName", tenant.slug) if draft_row else tenant.slug,
        "status": tenant.status,
        "ownerEmail": _owner_email(db, tenant.id),
        "createdAt": tenant.created_at.isoformat().replace("+00:00", "Z"),
        "updatedAt": tenant.updated_at.isoformat().replace("+00:00", "Z"),
    }


def get_dashboard_stats(db, tenant_id: str) -> dict[str, Any]:
    _get_tenant_or_404(db, tenant_id)
    published_row = _get_config_row(db, tenant_id, ConfigKind.PUBLISHED)
    last_published = None
    if published_row:
        last_published = published_row.config_json.get("publishedAt") or (
            published_row.published_at.isoformat().replace("+00:00", "Z") if published_row.published_at else None
        )
    from saas_api.services.analytics_service import get_dashboard_stats_from_metrics

    return get_dashboard_stats_from_metrics(db, tenant_id, last_published)


def get_dashboard_summary(db, tenant_id: str) -> dict[str, Any]:
    tenant = _get_tenant_or_404(db, tenant_id)
    draft_row = _get_config_row(db, tenant_id, ConfigKind.DRAFT)
    published_row = _get_config_row(db, tenant_id, ConfigKind.PUBLISHED)
    if not draft_row:
        raise AppError(ApiErrorCode.NOT_FOUND, "Draft config not found", status_code=404)
    draft = draft_row.config_json
    published = published_row.config_json if published_row else None
    stats = get_dashboard_stats(db, tenant_id)
    config_status = build_config_status(
        draft,
        published,
        draft_version=draft_row.version,
        published_version=published_row.version if published_row else None,
        last_published_at=(published or {}).get("publishedAt"),
    )
    modules = draft.get("modules", {})
    return {
        "tenantId": tenant.id,
        "slug": tenant.slug,
        "status": tenant.status,
        "setupChecklist": _setup_progress(draft),
        "activeProductsCount": _count_active_products(draft.get("products", [])),
        "enabledModulesCount": _count_enabled_modules(modules),
        "hasUnpublishedChanges": config_status["hasUnpublishedChanges"],
        "lastSavedDraft": (draft.get("meta") or {}).get("updatedAt"),
        "lastPublished": (published or {}).get("publishedAt"),
        "configStatus": config_status,
        "integrationStatuses": get_integration_statuses_dict(db, tenant.id),
        "analytics": stats,
    }


def _setup_progress(config: dict) -> dict[str, bool]:
    brand = config.get("brand", {})
    content = config.get("content", {})
    home = content.get("home", {})
    products = config.get("products", [])
    return {
        "brandAdded": bool(brand.get("displayName")),
        "designSelected": bool(config.get("theme", {}).get("preset")),
        "mainTextConfigured": bool(home.get("headline") and home.get("ctaLabel")),
        "hasActiveProduct": any(p.get("status") == "active" for p in products),
        "previewChecked": bool(config.get("publishedAt") or config.get("version", 0) > 0),
    }


def get_tenant_bundle(db, tenant_id: str) -> dict[str, Any]:
    _get_tenant_or_404(db, tenant_id)
    draft_row = _get_config_row(db, tenant_id, ConfigKind.DRAFT)
    published_row = _get_config_row(db, tenant_id, ConfigKind.PUBLISHED)
    if not draft_row:
        raise AppError(ApiErrorCode.NOT_FOUND, "Draft config not found", status_code=404)
    return {
        "draft": draft_row.config_json,
        "published": published_row.config_json if published_row else None,
    }
