from fastapi import APIRouter, Request

from backend_common.envelope import success_response
from backend_common.version import build_version_payload
from astro_api.settings import settings

router = APIRouter(tags=["health"])


@router.get("/health")
def health(request: Request) -> dict:
    return success_response(
        {"service": settings.service_name, "status": "ok"},
        request_id=getattr(request.state, "request_id", None),
    )


@router.get("/ready")
def ready(request: Request) -> dict:
    return success_response(
        {"service": settings.service_name, "status": "ready"},
        request_id=getattr(request.state, "request_id", None),
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
