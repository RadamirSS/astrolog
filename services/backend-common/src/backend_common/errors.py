from enum import StrEnum
from typing import Any


class ApiErrorCode(StrEnum):
    VALIDATION_ERROR = "VALIDATION_ERROR"
    UNAUTHORIZED = "UNAUTHORIZED"
    FORBIDDEN = "FORBIDDEN"
    NOT_FOUND = "NOT_FOUND"
    TENANT_NOT_FOUND = "TENANT_NOT_FOUND"
    TENANT_PAUSED = "TENANT_PAUSED"
    CONFIG_INVALID = "CONFIG_INVALID"
    REPORT_GENERATION_FAILED = "REPORT_GENERATION_FAILED"
    PRODUCT_NOT_FOUND = "PRODUCT_NOT_FOUND"
    DRAFT_CONFLICT = "DRAFT_CONFLICT"
    PUBLISH_FAILED = "PUBLISH_FAILED"
    RATE_LIMITED = "RATE_LIMITED"
    REMOTE_API_NOT_CONFIGURED = "REMOTE_API_NOT_CONFIGURED"
    UNKNOWN_ERROR = "UNKNOWN_ERROR"


class AppError(Exception):
    def __init__(
        self,
        code: ApiErrorCode | str,
        message: str,
        *,
        details: Any | None = None,
        field_errors: dict[str, list[str]] | None = None,
        status_code: int = 400,
    ) -> None:
        super().__init__(message)
        self.code = code
        self.message = message
        self.details = details
        self.field_errors = field_errors
        self.status_code = status_code
