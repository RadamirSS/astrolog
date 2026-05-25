from typing import Any

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session

from backend_common.envelope import success_response
from saas_api.auth.dependencies import get_current_account, require_platform_owner_or_admin
from saas_api.db.models.account import Account
from saas_api.db.session import get_db
from saas_api.services import admin_health_service, audit_service

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/tenants/{tenant_id}/health")
def get_tenant_health(
    tenant_id: str,
    request: Request,
    account: Account = Depends(require_platform_owner_or_admin),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    data = admin_health_service.get_tenant_health(db, tenant_id)
    return success_response(data, request_id=getattr(request.state, "request_id", None))


@router.get("/audit-logs")
def list_audit_logs(
    request: Request,
    tenant_id: str | None = Query(default=None, alias="tenantId"),
    action: str | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    account: Account = Depends(require_platform_owner_or_admin),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    data = audit_service.list_audit_logs(db, tenant_id=tenant_id, action=action, limit=limit)
    return success_response(data, request_id=getattr(request.state, "request_id", None))
