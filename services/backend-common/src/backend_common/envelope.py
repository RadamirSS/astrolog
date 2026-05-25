from datetime import UTC, datetime
from typing import Any, Generic, TypeVar

from pydantic import BaseModel, ConfigDict, Field

T = TypeVar("T")


def _utc_timestamp() -> str:
    return datetime.now(UTC).isoformat().replace("+00:00", "Z")


class ApiMeta(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    request_id: str | None = Field(default=None, alias="requestId")
    timestamp: str | None = None
    warnings: list[str] | None = None


class ApiErrorBody(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    code: str
    message: str
    details: Any | None = None
    field_errors: dict[str, list[str]] | None = Field(default=None, alias="fieldErrors")


class ApiSuccess(BaseModel, Generic[T]):
    model_config = ConfigDict(populate_by_name=True)

    ok: bool = True
    data: T
    meta: ApiMeta | None = None


class ApiFailure(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    ok: bool = False
    error: ApiErrorBody
    meta: ApiMeta | None = None


def build_meta(request_id: str | None = None, warnings: list[str] | None = None) -> ApiMeta:
    return ApiMeta(requestId=request_id, timestamp=_utc_timestamp(), warnings=warnings)


def success_response(
    data: Any,
    *,
    request_id: str | None = None,
    warnings: list[str] | None = None,
) -> dict[str, Any]:
    envelope = ApiSuccess(data=data, meta=build_meta(request_id, warnings))
    return envelope.model_dump(by_alias=True, exclude_none=True)


def failure_response(
    code: str,
    message: str,
    *,
    request_id: str | None = None,
    details: Any | None = None,
    field_errors: dict[str, list[str]] | None = None,
) -> dict[str, Any]:
    envelope = ApiFailure(
        error=ApiErrorBody(
            code=code,
            message=message,
            details=details,
            fieldErrors=field_errors,
        ),
        meta=build_meta(request_id),
    )
    return envelope.model_dump(by_alias=True, exclude_none=True)
