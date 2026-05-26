from __future__ import annotations

from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from backend_common.envelope import success_response
from saas_api.db.session import get_db
from saas_api.services import public_miniapp_service

router = APIRouter(prefix="/api/public/partners", tags=["public-partners"])

miniapps_router = APIRouter(prefix="/api/public/miniapps", tags=["public-miniapps"])


@miniapps_router.get("/{slug}")
def get_miniapp_by_slug(slug: str, request: Request, db: Session = Depends(get_db)) -> dict:
    data = public_miniapp_service.resolve_public_partner(db, slug)
    return success_response(data, request_id=getattr(request.state, "request_id", None))


@router.get("/{slug}")
def get_partner_by_slug(slug: str, request: Request, db: Session = Depends(get_db)) -> dict:
    data = public_miniapp_service.resolve_public_partner(db, slug)
    return success_response(data, request_id=getattr(request.state, "request_id", None))
