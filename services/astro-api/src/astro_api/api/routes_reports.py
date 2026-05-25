from fastapi import APIRouter, Request

from backend_common.envelope import success_response
from astro_api.schemas.reports import FreeReportRequest
from astro_api.services.report_stub import generate_free_report_stub

router = APIRouter(prefix="/v1/reports", tags=["reports"])


@router.post("/free")
def create_free_report(request: Request, body: FreeReportRequest) -> dict:
    report = generate_free_report_stub(body)
    return success_response(
        report.model_dump(by_alias=True, exclude_none=True),
        request_id=getattr(request.state, "request_id", None),
    )
