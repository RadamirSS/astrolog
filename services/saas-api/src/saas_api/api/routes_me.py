from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from backend_common.envelope import success_response
from backend_common.errors import ApiErrorCode, AppError
from saas_api.auth.end_user_dependencies import get_current_end_user
from saas_api.db.models.end_user import EndUser
from saas_api.db.session import get_db
from saas_api.schemas.birth_profile import BirthProfileInput, BirthProfileResponse
from saas_api.services.birth_profile_service import get_birth_profile, save_birth_profile
from saas_api.services.end_user_service import end_user_to_summary

router = APIRouter(prefix="/api/me", tags=["me"])


@router.get("")
def get_me(
    request: Request,
    end_user: EndUser = Depends(get_current_end_user),
) -> dict:
    data = end_user_to_summary(end_user)
    return success_response(
        data.model_dump(by_alias=True),
        request_id=getattr(request.state, "request_id", None),
    )


@router.get("/birth-profile")
def get_my_birth_profile(
    request: Request,
    end_user: EndUser = Depends(get_current_end_user),
    db: Session = Depends(get_db),
) -> dict:
    profile = get_birth_profile(db, end_user)
    if not profile:
        raise AppError(ApiErrorCode.NOT_FOUND, "Birth profile not found", status_code=404)
    data = BirthProfileResponse(
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
    return success_response(
        data.model_dump(by_alias=True),
        request_id=getattr(request.state, "request_id", None),
    )


@router.post("/birth-profile")
def save_my_birth_profile(
    body: BirthProfileInput,
    request: Request,
    end_user: EndUser = Depends(get_current_end_user),
    db: Session = Depends(get_db),
) -> dict:
    data = save_birth_profile(db, end_user=end_user, payload=body)
    return success_response(
        data.model_dump(by_alias=True),
        request_id=getattr(request.state, "request_id", None),
    )
