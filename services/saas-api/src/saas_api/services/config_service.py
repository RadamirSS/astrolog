from copy import deepcopy
from datetime import UTC, datetime

from backend_common.errors import ApiErrorCode, AppError
from saas_api.auth.passwords import new_id
from saas_api.db.models.account import Account
from saas_api.db.models.tenant import Tenant, TenantStatus
from saas_api.db.models.tenant_config import ConfigKind, TenantConfig
from saas_api.services.audit_service import log_action
from saas_api.services.config_diff import build_config_status
from saas_api.services.config_validation import validate_tenant_config
from saas_api.services.seed_builder import publish_config_copy


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


def get_draft_config(db, tenant_id: str) -> dict:
    _get_tenant_or_404(db, tenant_id)
    row = _get_config_row(db, tenant_id, ConfigKind.DRAFT)
    if not row:
        raise AppError(ApiErrorCode.NOT_FOUND, "Draft config not found", status_code=404)
    return row.config_json


def get_published_config(db, tenant_id: str) -> dict | None:
    _get_tenant_or_404(db, tenant_id)
    row = _get_config_row(db, tenant_id, ConfigKind.PUBLISHED)
    return row.config_json if row else None


def find_published_by_public_slug(db, slug: str) -> tuple[Tenant, dict] | None:
    """Find tenant and published config by miniApp.publicSlug."""
    normalized = (slug or "").strip().lower()
    if not normalized:
        return None

    rows = (
        db.query(Tenant, TenantConfig)
        .join(TenantConfig, TenantConfig.tenant_id == Tenant.id)
        .filter(TenantConfig.kind == ConfigKind.PUBLISHED)
        .all()
    )
    for tenant, config_row in rows:
        config = config_row.config_json or {}
        mini_app = config.get("miniApp") or {}
        public_slug = str(mini_app.get("publicSlug") or "").strip().lower()
        if public_slug == normalized:
            return tenant, config
    return None


def save_draft_config(db, tenant_id: str, config: dict, actor: Account) -> dict:
    _get_tenant_or_404(db, tenant_id)
    validated = validate_tenant_config(config, expected_tenant_id=tenant_id)
    now = _utc_now_iso()
    validated = deepcopy(validated)
    meta = validated.get("meta") or {}
    meta["updatedAt"] = now
    meta.setdefault("createdAt", now)
    validated["meta"] = meta

    row = _get_config_row(db, tenant_id, ConfigKind.DRAFT)
    if not row:
        row = TenantConfig(
            id=new_id("cfg"),
            tenant_id=tenant_id,
            kind=ConfigKind.DRAFT,
            version=validated.get("version", 1),
            config_json=validated,
            created_at=datetime.now(UTC),
            updated_at=datetime.now(UTC),
        )
        db.add(row)
    else:
        row.config_json = validated
        row.version = validated.get("version", row.version)
        row.updated_at = datetime.now(UTC)

    log_action(db, action="draft_config_saved", actor_account_id=actor.id, tenant_id=tenant_id)
    db.commit()
    db.refresh(row)
    return row.config_json


def get_config_status(db, tenant_id: str) -> dict:
    _get_tenant_or_404(db, tenant_id)
    draft_row = _get_config_row(db, tenant_id, ConfigKind.DRAFT)
    published_row = _get_config_row(db, tenant_id, ConfigKind.PUBLISHED)
    if not draft_row:
        raise AppError(ApiErrorCode.NOT_FOUND, "Draft config not found", status_code=404)
    published = published_row.config_json if published_row else None
    return build_config_status(
        draft_row.config_json,
        published,
        draft_version=draft_row.version,
        published_version=published_row.version if published_row else None,
        last_published_at=(published or {}).get("publishedAt"),
    )


def publish_config(db, tenant_id: str, actor: Account) -> dict:
    tenant = _get_tenant_or_404(db, tenant_id)
    draft_row = _get_config_row(db, tenant_id, ConfigKind.DRAFT)
    if not draft_row:
        raise AppError(ApiErrorCode.PUBLISH_FAILED, "No draft config to publish", status_code=400)

    published_row = _get_config_row(db, tenant_id, ConfigKind.PUBLISHED)
    next_version = (published_row.version if published_row else draft_row.version) + 1
    published_config = publish_config_copy(draft_row.config_json, version=next_version)

    now_dt = datetime.now(UTC)
    if published_row:
        published_row.config_json = published_config
        published_row.version = next_version
        published_row.updated_at = now_dt
        published_row.published_at = now_dt
    else:
        db.add(
            TenantConfig(
                id=new_id("cfg"),
                tenant_id=tenant_id,
                kind=ConfigKind.PUBLISHED,
                version=next_version,
                config_json=published_config,
                created_at=now_dt,
                updated_at=now_dt,
                published_at=now_dt,
            )
        )

    draft_copy = deepcopy(published_config)
    draft_row.config_json = draft_copy
    draft_row.version = next_version
    draft_row.updated_at = now_dt

    if tenant.status == TenantStatus.DRAFT:
        tenant.status = TenantStatus.ACTIVE
    tenant.updated_at = now_dt

    log_action(db, action="config_published", actor_account_id=actor.id, tenant_id=tenant_id)
    db.commit()
    return published_config


def discard_draft(db, tenant_id: str, actor: Account) -> dict:
    return _restore_draft_from_published(db, tenant_id, actor, action="draft_discarded")


def restore_draft_from_published(db, tenant_id: str, actor: Account) -> dict:
    return _restore_draft_from_published(db, tenant_id, actor, action="draft_restored")


def _restore_draft_from_published(db, tenant_id: str, actor: Account, *, action: str) -> dict:
    _get_tenant_or_404(db, tenant_id)
    published_row = _get_config_row(db, tenant_id, ConfigKind.PUBLISHED)
    if not published_row:
        raise AppError(ApiErrorCode.NOT_FOUND, "No published config to restore from", status_code=404)

    draft_row = _get_config_row(db, tenant_id, ConfigKind.DRAFT)
    restored = deepcopy(published_row.config_json)
    now = _utc_now_iso()
    meta = restored.get("meta") or {}
    meta["updatedAt"] = now
    restored["meta"] = meta

    if not draft_row:
        draft_row = TenantConfig(
            id=new_id("cfg"),
            tenant_id=tenant_id,
            kind=ConfigKind.DRAFT,
            version=published_row.version,
            config_json=restored,
            created_at=datetime.now(UTC),
            updated_at=datetime.now(UTC),
        )
        db.add(draft_row)
    else:
        draft_row.config_json = restored
        draft_row.version = published_row.version
        draft_row.updated_at = datetime.now(UTC)

    log_action(db, action=action, actor_account_id=actor.id, tenant_id=tenant_id)
    db.commit()
    db.refresh(draft_row)
    return draft_row.config_json
