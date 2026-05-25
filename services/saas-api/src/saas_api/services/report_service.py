from datetime import UTC, datetime
from typing import Any

from sqlalchemy.orm import Session

from backend_common.errors import ApiErrorCode, AppError
from saas_api.auth.passwords import new_id
from saas_api.db.models.birth_profile import BirthProfile
from saas_api.db.models.end_user import EndUser
from saas_api.db.models.report import Report, ReportStatus
from saas_api.db.models.tenant import Tenant
from saas_api.schemas.birth_profile import BirthProfileInput, normalize_locale
from saas_api.schemas.reports import ReportListItem, ReportStatusResponse
from saas_api.services.astro_client import AstroClientError, generate_free_report
from saas_api.services.commerce_store import find_entitlement_for_report, get_paid_report_json
from saas_api.services.birth_profile_service import save_birth_profile
from saas_api.services.config_service import get_published_config
from saas_api.services.public_tenant_service import ensure_public_runtime_tenant, _get_tenant_by_slug


def _build_style_profile(config: dict) -> dict[str, str]:
    brand = config.get("brand") or {}
    display_name = brand.get("displayName") or brand.get("name") or "Astrology"
    tagline = brand.get("tagline") or "Personalized guidance"
    return {"tone": tagline, "brandVoice": display_name}


def _birth_profile_to_astro(profile: BirthProfile) -> dict[str, Any]:
    return {
        "name": profile.name,
        "birthDate": profile.birth_date,
        "birthTime": profile.birth_time,
        "birthCity": profile.birth_city,
        "topic": profile.topic,
    }


def _report_to_list_item(report: Report) -> ReportListItem:
    title = "Reading"
    generated_at = report.created_at.isoformat().replace("+00:00", "Z")
    report_type = report.report_type
    if report.report_json:
        title = report.report_json.get("title") or title
        generated_at = report.report_json.get("generatedAt") or generated_at
        report_type = report.report_json.get("type") or report_type
    return ReportListItem(
        id=report.id,
        type=report_type,
        title=title,
        generatedAt=generated_at,
    )


def list_reports_for_user(db: Session, end_user: EndUser) -> list[ReportListItem]:
    reports = (
        db.query(Report)
        .filter(Report.tenant_id == end_user.tenant_id, Report.end_user_id == end_user.id)
        .order_by(Report.created_at.desc())
        .all()
    )
    return [_report_to_list_item(report) for report in reports]


def get_report_for_user(db: Session, *, end_user: EndUser, report_id: str) -> ReportStatusResponse:
    report = db.get(Report, report_id)
    if report and report.end_user_id == end_user.id and report.tenant_id == end_user.tenant_id:
        created_at = report.created_at.isoformat().replace("+00:00", "Z")
        completed_at = (
            report.completed_at.isoformat().replace("+00:00", "Z") if report.completed_at else None
        )
        return ReportStatusResponse(
            id=report.id,
            status=report.status,
            reportType=report.report_type,
            locale=report.locale,
            errorCode=report.error_code,
            errorMessage=report.error_message,
            createdAt=created_at,
            completedAt=completed_at,
            report=report.report_json if report.status == ReportStatus.COMPLETED else None,
        )

    paid_report = _get_paid_report_for_user(db, end_user, report_id)
    if paid_report is not None:
        return paid_report

    raise AppError(ApiErrorCode.NOT_FOUND, "Report not found", status_code=404)


def _get_paid_report_for_user(
    db: Session, end_user: EndUser, report_id: str
) -> ReportStatusResponse | None:
    ent = find_entitlement_for_report(
        db, tenant_id=end_user.tenant_id, end_user_id=end_user.id, report_id=report_id
    )
    if not ent:
        return None
    if ent.status != "ready":
        raise AppError(
            "entitlement_not_ready",
            "Report is not ready yet",
            status_code=403,
        )
    payload = get_paid_report_json(db, report_id)
    if not payload:
        return ReportStatusResponse(
            id=report_id,
            status=ReportStatus.GENERATING,
            reportType=ent.product_type,
            locale="en",
            errorCode=None,
            errorMessage=None,
            createdAt=_now_iso(),
            completedAt=None,
            report=None,
        )
    return ReportStatusResponse(
        id=report_id,
        status=ReportStatus.COMPLETED,
        reportType=ent.product_type,
        locale=str(payload.get("locale") or "en"),
        errorCode=None,
        errorMessage=None,
        createdAt=str(payload.get("createdAt") or _now_iso()),
        completedAt=str(payload.get("updatedAt") or payload.get("createdAt") or _now_iso()),
        report=payload,
    )


def _now_iso() -> str:
    return datetime.now(UTC).isoformat().replace("+00:00", "Z")


def create_free_report(
    db: Session,
    *,
    end_user: EndUser,
    tenant_slug: str,
    birth_profile_input: BirthProfileInput,
    locale: str | None = None,
) -> dict[str, Any]:
    tenant = _get_tenant_by_slug(db, tenant_slug)
    ensure_public_runtime_tenant(tenant)
    if tenant.id != end_user.tenant_id:
        raise AppError(ApiErrorCode.FORBIDDEN, "Tenant mismatch for current user", status_code=403)

    normalized_locale = normalize_locale(locale or birth_profile_input.locale)
    profile_response = save_birth_profile(db, end_user=end_user, payload=birth_profile_input)
    profile = db.get(BirthProfile, profile_response.id)
    if not profile:
        raise AppError(ApiErrorCode.NOT_FOUND, "Birth profile not found", status_code=404)

    published_config = get_published_config(db, tenant.id)
    if not published_config:
        raise AppError(ApiErrorCode.NOT_FOUND, "No published config", status_code=404)

    now = datetime.now(UTC)
    report = Report(
        id=new_id("rep"),
        tenant_id=tenant.id,
        end_user_id=end_user.id,
        birth_profile_id=profile.id,
        report_type="free",
        status=ReportStatus.PENDING,
        locale=normalized_locale,
        request_json={
            "tenantSlug": tenant_slug,
            "birthProfile": birth_profile_input.model_dump(by_alias=True),
            "locale": normalized_locale,
        },
        created_at=now,
        updated_at=now,
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    report.status = ReportStatus.GENERATING
    report.updated_at = datetime.now(UTC)
    db.commit()

    astro_payload = {
        "tenantId": tenant.id,
        "tenantSlug": tenant.slug,
        "locale": normalized_locale,
        "reportType": "free",
        "birthProfile": _birth_profile_to_astro(profile),
        "styleProfile": _build_style_profile(published_config),
    }

    try:
        report_json = generate_free_report(astro_payload)
        report.status = ReportStatus.COMPLETED
        report.report_json = report_json
        report.completed_at = datetime.now(UTC)
        report.error_code = None
        report.error_message = None
    except AstroClientError as exc:
        report.status = ReportStatus.FAILED
        report.error_code = str(exc.code)
        report.error_message = exc.message
        report.updated_at = datetime.now(UTC)
        db.commit()
        raise AppError(
            ApiErrorCode.REPORT_GENERATION_FAILED,
            "Report generation failed",
            status_code=502,
        ) from exc

    report.updated_at = datetime.now(UTC)
    db.commit()
    db.refresh(report)
    return report_json
