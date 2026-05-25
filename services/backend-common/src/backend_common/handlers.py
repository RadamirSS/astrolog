import logging
from typing import Any

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from backend_common.envelope import failure_response
from backend_common.errors import ApiErrorCode, AppError

logger = logging.getLogger(__name__)

_STATUS_TO_CODE: dict[int, ApiErrorCode] = {
    401: ApiErrorCode.UNAUTHORIZED,
    403: ApiErrorCode.FORBIDDEN,
    404: ApiErrorCode.NOT_FOUND,
    429: ApiErrorCode.RATE_LIMITED,
}


def _request_id(request: Request) -> str | None:
    return getattr(request.state, "request_id", None)


def register_exception_handlers(app: FastAPI, service_logger: logging.Logger | None = None) -> None:
    log = service_logger or logger

    @app.exception_handler(AppError)
    async def app_error_handler(request: Request, exc: AppError) -> JSONResponse:
        log.warning("AppError [%s]: %s", exc.code, exc.message)
        return JSONResponse(
            status_code=exc.status_code,
            content=failure_response(
                str(exc.code),
                exc.message,
                request_id=_request_id(request),
                details=exc.details,
                field_errors=exc.field_errors,
            ),
        )

    @app.exception_handler(RequestValidationError)
    async def validation_error_handler(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        field_errors: dict[str, list[str]] = {}
        for error in exc.errors():
            loc = [str(part) for part in error.get("loc", []) if part != "body"]
            key = ".".join(loc) if loc else "body"
            field_errors.setdefault(key, []).append(error.get("msg", "Invalid value"))

        log.warning("Validation error: %s", field_errors)
        return JSONResponse(
            status_code=422,
            content=failure_response(
                ApiErrorCode.VALIDATION_ERROR,
                "Request validation failed",
                request_id=_request_id(request),
                field_errors=field_errors or None,
            ),
        )

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(
        request: Request, exc: StarletteHTTPException
    ) -> JSONResponse:
        code = _STATUS_TO_CODE.get(exc.status_code, ApiErrorCode.UNKNOWN_ERROR)
        detail = exc.detail if isinstance(exc.detail, str) else str(exc.detail)
        return JSONResponse(
            status_code=exc.status_code,
            content=failure_response(code, detail, request_id=_request_id(request)),
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        log.exception("Unhandled error: %s", exc)
        return JSONResponse(
            status_code=500,
            content=failure_response(
                ApiErrorCode.UNKNOWN_ERROR,
                "An unexpected error occurred",
                request_id=_request_id(request),
            ),
        )
