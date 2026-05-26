from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from backend_common.envelope import success_response
from saas_api.db.session import get_db
from saas_api.services.public_surface_service import resolve_public_surface

router = APIRouter(prefix="/api/public/surfaces", tags=["public-surfaces"])


@router.get("/{surface_type}/{slug}")
def get_public_surface(
    surface_type: str,
    slug: str,
    request: Request,
    db: Session = Depends(get_db),
) -> dict:
    data = resolve_public_surface(db, surface_type, slug)
    return success_response(data, request_id=getattr(request.state, "request_id", None))
