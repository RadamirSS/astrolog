from datetime import UTC, datetime

from sqlalchemy.orm import Session

from backend_common.errors import ApiErrorCode, AppError
from saas_api.auth.passwords import new_id
from saas_api.db.models.birth_profile import BirthProfile
from saas_api.db.models.end_user import EndUser
from saas_api.schemas.birth_profile import BirthProfileInput, BirthProfileResponse, normalize_locale


def _to_response(profile: BirthProfile) -> BirthProfileResponse:
    return BirthProfileResponse(
        id=profile.id,
        userId=profile.end_user_id,
        tenantId=profile.tenant_id,
        name=profile.name,
        birthDate=profile.birth_date,
        birthTime=profile.birth_time,
        birthPlace=profile.birth_city,
        topic=profile.topic,
        locale=profile.locale,
        createdAt=profile.created_at.isoformat().replace("+00:00", "Z"),
    )


def get_birth_profile(db: Session, end_user: EndUser) -> BirthProfile | None:
    return (
        db.query(BirthProfile)
        .filter(BirthProfile.tenant_id == end_user.tenant_id, BirthProfile.end_user_id == end_user.id)
        .order_by(BirthProfile.updated_at.desc())
        .first()
    )


def save_birth_profile(
    db: Session,
    *,
    end_user: EndUser,
    payload: BirthProfileInput,
) -> BirthProfileResponse:
    now = datetime.now(UTC)
    locale = normalize_locale(payload.locale)
    existing = get_birth_profile(db, end_user)
    if existing:
        existing.name = payload.name.strip()
        existing.birth_date = payload.birth_date
        existing.birth_time = payload.birth_time
        existing.birth_city = payload.birth_city or ""
        existing.topic = payload.topic
        existing.locale = locale
        existing.updated_at = now
        profile = existing
    else:
        profile = BirthProfile(
            id=new_id("bp"),
            tenant_id=end_user.tenant_id,
            end_user_id=end_user.id,
            name=payload.name.strip(),
            birth_date=payload.birth_date,
            birth_time=payload.birth_time,
            birth_city=payload.birth_city or "",
            topic=payload.topic,
            locale=locale,
            created_at=now,
            updated_at=now,
        )
        db.add(profile)
    db.commit()
    db.refresh(profile)
    return _to_response(profile)


def require_birth_profile(db: Session, end_user: EndUser) -> BirthProfile:
    profile = get_birth_profile(db, end_user)
    if not profile:
        raise AppError(ApiErrorCode.NOT_FOUND, "Birth profile not found", status_code=404)
    return profile
