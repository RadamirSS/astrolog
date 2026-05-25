from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from sqlalchemy import text

from backend_common.envelope import failure_response, success_response
from backend_common.errors import ApiErrorCode
from backend_common.version import build_version_payload
from saas_api.db.session import get_engine
from saas_api.settings import settings

router = APIRouter(tags=["health"])


@router.get("/health")
def health(request: Request) -> dict:
    return success_response(
        {"service": settings.service_name, "status": "ok"},
        request_id=getattr(request.state, "request_id", None),
    )


@router.get("/ready", response_model=None)
def ready(request: Request) -> JSONResponse:
    request_id = getattr(request.state, "request_id", None)
    try:
        with get_engine().connect() as connection:
            connection.execute(text("SELECT 1"))
    except Exception:
        return JSONResponse(
            status_code=503,
            content=failure_response(
                ApiErrorCode.UNKNOWN_ERROR,
                "Database is not reachable",
                request_id=request_id,
            ),
        )
    return JSONResponse(
        content=success_response(
            {"service": settings.service_name, "status": "ready"},
            request_id=request_id,
        ),
    )


@router.get("/version")
def version(request: Request) -> dict:
    return success_response(
        build_version_payload(settings.service_name, settings.app_version, settings.app_env),
        request_id=getattr(request.state, "request_id", None),
    )


@router.get("/")
def root(request: Request) -> dict:
    return success_response(
        {
            "service": settings.service_name,
            "version": settings.app_version,
            "docs": "/docs",
        },
        request_id=getattr(request.state, "request_id", None),
    )
