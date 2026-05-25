from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from backend_common.envelope import success_response
from saas_api.auth.end_user_dependencies import get_current_end_user
from saas_api.db.models.end_user import EndUser
from saas_api.db.models.report import ReportStatus
from saas_api.db.session import get_db
from saas_api.schemas.reports import FreeReportRequest
from saas_api.services.report_service import create_free_report, get_report_for_user, list_reports_for_user

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.post("/free")
def generate_free_report_route(
    body: FreeReportRequest,
    request: Request,
    end_user: EndUser = Depends(get_current_end_user),
    db: Session = Depends(get_db),
) -> dict:
    report_json = create_free_report(
        db,
        end_user=end_user,
        tenant_slug=body.tenant_slug,
        birth_profile_input=body.birth_profile,
        locale=body.locale,
    )
    return success_response(
        report_json,
        request_id=getattr(request.state, "request_id", None),
    )


@router.get("")
def list_my_reports(
    request: Request,
    end_user: EndUser = Depends(get_current_end_user),
    db: Session = Depends(get_db),
) -> dict:
    items = list_reports_for_user(db, end_user)
    data = [item.model_dump(by_alias=True) for item in items]
    return success_response(data, request_id=getattr(request.state, "request_id", None))


@router.get("/{report_id}")
def get_my_report(
    report_id: str,
    request: Request,
    end_user: EndUser = Depends(get_current_end_user),
    db: Session = Depends(get_db),
) -> dict:
    status_response = get_report_for_user(db, end_user=end_user, report_id=report_id)
    if status_response.status == ReportStatus.COMPLETED and status_response.report:
        return success_response(
            status_response.report,
            request_id=getattr(request.state, "request_id", None),
        )
    return success_response(
        status_response.model_dump(by_alias=True, exclude={"report"}),
        request_id=getattr(request.state, "request_id", None),
    )
