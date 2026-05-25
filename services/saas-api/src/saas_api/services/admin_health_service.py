from datetime import UTC, datetime, timedelta
from typing import Any

from backend_common.errors import ApiErrorCode, AppError
from saas_api.db.models.report import Report, ReportStatus
from saas_api.db.models.tenant import Tenant, TenantStatus
from saas_api.db.models.tenant_config import ConfigKind, TenantConfig
from saas_api.services.analytics_service import count_recent_events
from saas_api.services.integration_service import get_integration_statuses_dict
from saas_api.services.media_service import count_media_by_kind


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


def _count_active_products(config: dict | None) -> int:
    if not config:
        return 0
    return sum(1 for p in config.get("products", []) if p.get("status") == "active")


def _count_enabled_modules(config: dict | None) -> int:
    if not config:
        return 0
    modules = config.get("modules", {})
    keys = ["onboarding", "freeReport", "products", "profile"]
    return sum(1 for k in keys if modules.get(k))


def get_tenant_health(db, tenant_id: str) -> dict[str, Any]:
    tenant = _get_tenant_or_404(db, tenant_id)
    draft_row = _get_config_row(db, tenant_id, ConfigKind.DRAFT)
    published_row = _get_config_row(db, tenant_id, ConfigKind.PUBLISHED)
    draft = draft_row.config_json if draft_row else None
    published = published_row.config_json if published_row else None

    since = datetime.now(UTC) - timedelta(days=7)
    recent_failures = (
        db.query(Report)
        .filter(
            Report.tenant_id == tenant_id,
            Report.status == ReportStatus.FAILED,
            Report.created_at >= since,
        )
        .count()
    )
    last_report = (
        db.query(Report)
        .filter(Report.tenant_id == tenant_id, Report.status == ReportStatus.COMPLETED)
        .order_by(Report.completed_at.desc())
        .first()
    )
    last_published = None
    if published_row and published_row.published_at:
        last_published = published_row.published_at.isoformat().replace("+00:00", "Z")
    elif published:
        last_published = published.get("publishedAt")

    media_counts = count_media_by_kind(db, tenant_id)
    integration_statuses = get_integration_statuses_dict(db, tenant_id)

    warnings: list[str] = []
    if tenant.status == TenantStatus.PAUSED:
        warnings.append("Tenant is paused")
    if tenant.status == TenantStatus.DRAFT:
        warnings.append("Tenant is in draft status")
    if not published_row:
        warnings.append("No published configuration")
    if recent_failures > 0:
        warnings.append(f"{recent_failures} report failure(s) in the last 7 days")
    if _count_active_products(draft) == 0:
        warnings.append("No active products in draft config")

    return {
        "tenantId": tenant.id,
        "slug": tenant.slug,
        "status": tenant.status,
        "hasPublishedConfig": published_row is not None,
        "hasDraftConfig": draft_row is not None,
        "activeProductCount": _count_active_products(draft),
        "enabledModulesCount": _count_enabled_modules(draft),
        "recentAnalyticsCount": count_recent_events(db, tenant_id, 7),
        "recentReportFailures": recent_failures,
        "lastReportGeneratedAt": (
            last_report.completed_at.isoformat().replace("+00:00", "Z")
            if last_report and last_report.completed_at
            else None
        ),
        "lastPublishedAt": last_published,
        "integrationStatuses": integration_statuses,
        "mediaAssetCounts": media_counts,
        "warnings": warnings,
    }
