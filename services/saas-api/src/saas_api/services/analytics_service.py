from datetime import UTC, datetime, timedelta
from typing import Any

from backend_common.errors import ApiErrorCode, AppError
from saas_api.auth.passwords import new_id
from saas_api.db.models.account import Account
from saas_api.db.models.analytics_event import AnalyticsEvent, AnalyticsSource
from saas_api.db.models.end_user import EndUser
from saas_api.db.models.report import Report, ReportStatus
from saas_api.db.models.tenant import Tenant

# Keep in sync with packages/api-contracts/src/analytics.ts
KNOWN_EVENT_NAMES = frozenset(
    {
        "miniapp_opened",
        "partner_link_clicked",
        "landing_viewed",
        "tenant_home_viewed",
        "topic_selected",
        "onboarding_started",
        "birth_form_started",
        "birth_form_completed",
        "birth_profile_submitted",
        "free_report_requested",
        "free_report_ready",
        "free_report_viewed",
        "paywall_viewed",
        "product_viewed",
        "checkout_started",
        "mock_payment_created",
        "payment_created",
        "payment_redirected",
        "payment_return_success",
        "payment_return_cancel",
        "payment_return_pending",
        "payment_return_failed",
        "payment_status_checked",
        "payment_paid",
        "entitlement_created",
        "entitlement_ready",
        "entitlement_failed",
        "paid_report_requested",
        "paid_report_status_checked",
        "paid_report_ready",
        "paid_report_failed",
        "report_retry_requested",
        "my_reports_viewed",
        "report_opened",
        "paid_report_opened",
        "pdf_downloaded",
        "premium_product_viewed",
        "premium_request_started",
        "premium_request_submitted",
        "premium_request_status_viewed",
        "report_failed_viewed",
        "report_retry_clicked",
        "support_needed_clicked",
        "product_list_viewed",
        "product_clicked",
        "product_cta_clicked",
        "profile_viewed",
        "dashboard_opened",
        "dashboard_setup_started",
        "dashboard_setup_completed",
        "dashboard_brand_saved",
        "dashboard_design_saved",
        "dashboard_content_saved",
        "dashboard_product_created",
        "dashboard_product_updated",
        "dashboard_product_deleted",
        "dashboard_preview_opened",
        "dashboard_publish_clicked",
        "dashboard_config_published",
        "dashboard_draft_discarded",
        "dashboard_order_payment_synced",
        "dashboard_order_report_synced",
        "dashboard_order_report_retried",
        "dashboard_order_needs_review",
        "dashboard_entitlement_revoked",
        "dashboard_entitlement_unlocked",
        "dashboard_premium_request_updated",
        "dashboard_premium_request_note_added",
        "superadmin_opened",
        "superadmin_tenant_created",
        "superadmin_tenant_status_changed",
        "superadmin_tenant_preview_opened",
    }
)

EVENT_METRIC_KEYS = {
    "miniapp_opened": "visits",
    "onboarding_started": "onboardingStarts",
    "birth_profile_submitted": "birthProfilesSubmitted",
    "free_report_requested": "freeReportsRequested",
    "free_report_viewed": "freeReportsViewed",
    "product_clicked": "productClicks",
    "product_cta_clicked": "productCtaClicks",
    "my_reports_viewed": "myReportsViews",
    "report_opened": "reportsOpened",
    "paid_report_opened": "paidReportsOpened",
    "pdf_downloaded": "pdfDownloads",
    "premium_request_submitted": "premiumRequestsSubmitted",
    "checkout_started": "checkoutStarts",
    "payment_paid": "paymentsPaid",
}


def _infer_source(event_name: str) -> str:
    if event_name.startswith("superadmin_"):
        return AnalyticsSource.SUPERADMIN
    if event_name.startswith("dashboard_"):
        return AnalyticsSource.DASHBOARD
    return AnalyticsSource.MINIAPP


def _resolve_tenant_id(db, tenant_id: str | None, tenant_slug: str | None) -> str | None:
    if tenant_id:
        return tenant_id
    if tenant_slug:
        tenant = db.query(Tenant).filter(Tenant.slug == tenant_slug).first()
        if tenant:
            return tenant.id
    return None


def _parse_timestamp(value: str | None) -> datetime:
    if not value:
        return datetime.now(UTC)
    try:
        normalized = value.replace("Z", "+00:00")
        parsed = datetime.fromisoformat(normalized)
        if parsed.tzinfo is None:
            return parsed.replace(tzinfo=UTC)
        return parsed.astimezone(UTC)
    except ValueError:
        return datetime.now(UTC)


def _period_start(period: str) -> datetime:
    now = datetime.now(UTC)
    if period == "30d":
        return now - timedelta(days=30)
    return now - timedelta(days=7)


def _safe_ratio(numerator: int, denominator: int) -> float:
    if denominator <= 0:
        return 0.0
    return round(numerator / denominator, 4)


def ingest_events(
    db,
    events: list[dict[str, Any]],
    *,
    end_user: EndUser | None = None,
    account: Account | None = None,
) -> None:
    for event in events:
        event_name = event.get("eventName") or event.get("event_name")
        if not event_name or not isinstance(event_name, str):
            continue
        if event_name not in KNOWN_EVENT_NAMES:
            continue

        tenant_id = _resolve_tenant_id(
            db,
            event.get("tenantId") or event.get("tenant_id"),
            event.get("tenantSlug") or event.get("tenant_slug"),
        )
        end_user_id = end_user.id if end_user else None
        actor_account_id = account.id if account else None

        user_id = event.get("userId") or event.get("user_id")
        if user_id and not end_user_id:
            end_user_id = str(user_id)

        properties = event.get("properties")
        locale = None
        if isinstance(properties, dict):
            locale_value = properties.get("locale")
            if isinstance(locale_value, str):
                locale = locale_value[:8]

        db.add(
            AnalyticsEvent(
                id=new_id("anly"),
                tenant_id=tenant_id,
                end_user_id=end_user_id,
                actor_account_id=actor_account_id,
                session_id=event.get("sessionId") or event.get("session_id"),
                event_name=event_name,
                source=_infer_source(event_name),
                locale=locale,
                properties_json=properties if isinstance(properties, dict) else None,
                created_at=_parse_timestamp(event.get("timestamp")),
            )
        )
    db.commit()


def count_events_by_name(db, tenant_id: str, period: str) -> dict[str, int]:
    since = _period_start(period)
    rows = (
        db.query(AnalyticsEvent.event_name)
        .filter(AnalyticsEvent.tenant_id == tenant_id, AnalyticsEvent.created_at >= since)
        .all()
    )
    counts: dict[str, int] = {}
    for (event_name,) in rows:
        counts[event_name] = counts.get(event_name, 0) + 1
    return counts


def get_tenant_metrics(db, tenant_id: str, period: str = "7d") -> dict[str, Any]:
    tenant = db.get(Tenant, tenant_id)
    if not tenant:
        raise AppError(ApiErrorCode.NOT_FOUND, "Tenant not found", status_code=404)

    if period not in ("7d", "30d"):
        raise AppError(ApiErrorCode.VALIDATION_ERROR, "Invalid period", status_code=422)

    since = _period_start(period)
    event_counts = count_events_by_name(db, tenant_id, period)

    metrics = {
        "period": period,
        "visits": event_counts.get("miniapp_opened", 0),
        "onboardingStarts": event_counts.get("onboarding_started", 0),
        "birthProfilesSubmitted": event_counts.get("birth_profile_submitted", 0),
        "freeReportsRequested": event_counts.get("free_report_requested", 0),
        "freeReportsViewed": event_counts.get("free_report_viewed", 0),
        "productClicks": event_counts.get("product_clicked", 0),
        "productCtaClicks": event_counts.get("product_cta_clicked", 0),
        "myReportsViews": event_counts.get("my_reports_viewed", 0),
        "reportsOpened": event_counts.get("report_opened", 0),
        "paidReportsOpened": event_counts.get("paid_report_opened", 0),
        "pdfDownloads": event_counts.get("pdf_downloaded", 0),
        "premiumRequestsSubmitted": event_counts.get("premium_request_submitted", 0),
        "checkoutStarts": event_counts.get("checkout_started", 0),
        "paymentsPaid": event_counts.get("payment_paid", 0),
        "reportsGenerated": 0,
        "reportFailures": 0,
    }

    reports_generated = (
        db.query(Report)
        .filter(
            Report.tenant_id == tenant_id,
            Report.status == ReportStatus.COMPLETED,
            Report.created_at >= since,
        )
        .count()
    )
    report_failures = (
        db.query(Report)
        .filter(
            Report.tenant_id == tenant_id,
            Report.status == ReportStatus.FAILED,
            Report.created_at >= since,
        )
        .count()
    )
    metrics["reportsGenerated"] = reports_generated
    metrics["reportFailures"] = report_failures

    visits = metrics["visits"]
    profiles = metrics["birthProfilesSubmitted"]
    reports = metrics["freeReportsRequested"]
    product_clicks = metrics["productClicks"]

    metrics["conversion"] = {
        "visitToProfile": _safe_ratio(profiles, visits),
        "profileToReport": _safe_ratio(reports, profiles),
        "reportToProductClick": _safe_ratio(product_clicks, reports),
    }
    return metrics


def get_dashboard_stats_from_metrics(db, tenant_id: str, last_published_at: str | None) -> dict[str, Any]:
    metrics = get_tenant_metrics(db, tenant_id, "7d")
    return {
        "totalSessions": metrics["visits"],
        "reportsGenerated": metrics["reportsGenerated"],
        "productClicks": metrics["productClicks"],
        "lastPublishedAt": last_published_at,
    }


def count_recent_events(db, tenant_id: str, days: int = 7) -> int:
    since = datetime.now(UTC) - timedelta(days=days)
    return (
        db.query(AnalyticsEvent)
        .filter(AnalyticsEvent.tenant_id == tenant_id, AnalyticsEvent.created_at >= since)
        .count()
    )
