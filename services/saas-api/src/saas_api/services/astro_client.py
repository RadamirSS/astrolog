from __future__ import annotations

import logging
import threading
import time
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

import httpx

from backend_common.errors import ApiErrorCode

from saas_api.settings import settings

logger = logging.getLogger(__name__)

V2_REQUIRED_FIELDS = (
    "schemaVersion",
    "id",
    "productType",
    "level",
    "title",
    "status",
    "sections",
)
V1_REQUIRED_FIELDS = ("id", "type", "title", "summary", "highlights", "sections", "generatedAt")

MOCK_ASTRO_REPORTS: dict[str, dict[str, Any]] = {}


class AstroClientError(Exception):
    def __init__(self, code: str, message: str) -> None:
        super().__init__(message)
        self.code = code
        self.message = message


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def _is_v2_report(data: dict[str, Any]) -> bool:
    return data.get("schemaVersion") == 2


def validate_report_payload(data: dict[str, Any]) -> dict[str, Any]:
    if _is_v2_report(data):
        missing = [
            field
            for field in V2_REQUIRED_FIELDS
            if field not in data or data[field] in (None, "")
        ]
        if missing:
            raise AstroClientError(
                "astro_api_invalid_response",
                f"Invalid V2 report payload: missing {', '.join(missing)}",
            )
        if not isinstance(data.get("sections"), list):
            raise AstroClientError("astro_api_invalid_response", "Invalid sections list")
        return data

    missing = [
        field for field in V1_REQUIRED_FIELDS if field not in data or data[field] in (None, "")
    ]
    if missing:
        raise AstroClientError(
            ApiErrorCode.REPORT_GENERATION_FAILED,
            f"Invalid report payload: missing {', '.join(missing)}",
        )
    if not isinstance(data.get("highlights"), list):
        raise AstroClientError(ApiErrorCode.REPORT_GENERATION_FAILED, "Invalid highlights list")
    if not isinstance(data.get("sections"), list):
        raise AstroClientError(ApiErrorCode.REPORT_GENERATION_FAILED, "Invalid sections list")
    return data


def _headers() -> dict[str, str]:
    headers = {"Content-Type": "application/json"}
    if settings.astro_api_token:
        headers["Authorization"] = f"Bearer {settings.astro_api_token}"
    return headers


def _parse_envelope(body: dict[str, Any]) -> dict[str, Any]:
    if body.get("ok") is not True:
        error = body.get("error") if isinstance(body.get("error"), dict) else {}
        raise AstroClientError(
            error.get("code") or ApiErrorCode.REPORT_GENERATION_FAILED,
            error.get("message") or "Astro API returned an error",
        )
    data = body.get("data")
    if not isinstance(data, dict):
        raise AstroClientError(
            ApiErrorCode.REPORT_GENERATION_FAILED,
            "Astro API response data is invalid",
        )
    return data


def _remote_post(path: str, payload: dict[str, Any]) -> dict[str, Any]:
    url = f"{settings.astro_api_base_url.rstrip('/')}{path}"
    timeout = settings.astro_api_timeout_seconds
    try:
        with httpx.Client(timeout=timeout) as client:
            response = client.post(url, json=payload, headers=_headers())
    except httpx.TimeoutException as exc:
        raise AstroClientError("astro_api_timeout", "Astro API request timed out") from exc
    except httpx.HTTPError as exc:
        raise AstroClientError("astro_api_unavailable", "Astro API request failed") from exc

    try:
        body = response.json()
    except ValueError as exc:
        raise AstroClientError(
            ApiErrorCode.REPORT_GENERATION_FAILED,
            "Astro API returned invalid JSON",
        ) from exc

    if not isinstance(body, dict):
        raise AstroClientError("astro_api_invalid_response", "Astro API returned invalid response")
    if "ok" in body:
        return _parse_envelope(body)
    return body


def _remote_get(path: str) -> dict[str, Any]:
    url = f"{settings.astro_api_base_url.rstrip('/')}{path}"
    timeout = settings.astro_api_timeout_seconds
    try:
        with httpx.Client(timeout=timeout) as client:
            response = client.get(url, headers=_headers())
    except httpx.TimeoutException as exc:
        raise AstroClientError("astro_api_timeout", "Astro API request timed out") from exc
    except httpx.HTTPError as exc:
        raise AstroClientError("astro_api_unavailable", "Astro API request failed") from exc

    try:
        body = response.json()
    except ValueError as exc:
        raise AstroClientError(
            ApiErrorCode.REPORT_GENERATION_FAILED,
            "Astro API returned invalid JSON",
        ) from exc

    if not isinstance(body, dict):
        raise AstroClientError("astro_api_invalid_response", "Astro API returned invalid response")
    if "ok" in body:
        return _parse_envelope(body)
    return body


def _build_mock_v2_report(
    *,
    report_id: str,
    product_type: str,
    level: str,
    theme: str | None,
    title: str,
) -> dict[str, Any]:
    now = _now_iso()
    return {
        "schemaVersion": 2,
        "id": report_id,
        "productType": product_type,
        "level": level,
        "theme": theme or "relationships",
        "title": title,
        "subtitle": "Mock generated report",
        "visualPack": "cosmic_pastel",
        "status": "ready",
        "sections": [
            {
                "id": "hero",
                "type": "hero",
                "title": title,
                "subtitle": "Mock insight",
                "order": 0,
            },
            {
                "id": "summary",
                "type": "summary",
                "title": "Summary",
                "content": "This is a mock report for pilot integration testing.",
                "order": 1,
            },
        ],
        "actions": [],
        "pdfUrl": "https://cdn.example.com/pilot/reports/mock-saas-v2.pdf",
        "createdAt": now,
        "updatedAt": now,
    }


def _schedule_mock_ready(report_id: str, payload: dict[str, Any], delay_seconds: float = 0.5) -> None:
    def _run() -> None:
        time.sleep(delay_seconds)
        entry = MOCK_ASTRO_REPORTS.get(report_id)
        if not entry or entry.get("status") == "failed":
            return
        entry["status"] = "ready"
        entry["progress"] = 100
        entry["payload"] = payload
        entry["updatedAt"] = _now_iso()

    threading.Thread(target=_run, daemon=True).start()


def generate_free_report(payload: dict[str, Any]) -> dict[str, Any]:
    if settings.astro_api_mode == "mock":
        report_id = f"rep_free_{uuid4().hex[:10]}"
        title = str(payload.get("productTitle") or "Free Reading")
        report = _build_mock_v2_report(
            report_id=report_id,
            product_type="free_report",
            level="free",
            theme=(payload.get("birthProfile") or {}).get("topic"),
            title=title,
        )
        return validate_report_payload(report)

    data = _remote_post("/v1/reports/free", payload)
    if "reportId" in data or "report_id" in data:
        report_id = str(data.get("reportId") or data.get("report_id"))
        status_data = {"status": str(data.get("status", "queued"))}
        if status_data["status"] != "ready":
            for _ in range(30):
                time.sleep(0.4)
                status_data = get_report_status(report_id)
                if status_data.get("status") in {"ready", "failed"}:
                    break
            if status_data.get("status") == "failed":
                raise AstroClientError(
                    ApiErrorCode.REPORT_GENERATION_FAILED,
                    "Free report generation failed",
                )
            return validate_report_payload(get_report_result(report_id))
    return validate_report_payload(data)


def request_paid_report(payload: dict[str, Any]) -> dict[str, Any]:
    if settings.astro_api_mode == "mock":
        report_id = f"rep_paid_{uuid4().hex[:10]}"
        now = _now_iso()
        MOCK_ASTRO_REPORTS[report_id] = {
            "reportId": report_id,
            "status": "queued",
            "progress": 0,
            "updatedAt": now,
            "payload": None,
        }
        mock_report = _build_mock_v2_report(
            report_id=report_id,
            product_type=str(payload.get("productType") or "full_natal"),
            level="paid",
            theme=payload.get("theme"),
            title=str(payload.get("productTitle") or "Paid Report"),
        )
        _schedule_mock_ready(report_id, mock_report, 0.6)
        return {"reportId": report_id, "status": "queued", "estimatedReadyAt": None}

    data = _remote_post("/v1/reports/paid", payload)
    report_id = str(data.get("reportId") or data.get("report_id") or "")
    if not report_id:
        raise AstroClientError("astro_api_invalid_response", "Paid report response missing reportId")
    return {
        "reportId": report_id,
        "status": str(data.get("status", "queued")),
        "estimatedReadyAt": data.get("estimatedReadyAt") or data.get("estimated_ready_at"),
    }


def get_report_status(report_id: str) -> dict[str, Any]:
    if settings.astro_api_mode == "mock":
        entry = MOCK_ASTRO_REPORTS.get(report_id)
        if not entry:
            raise AstroClientError("report_not_found", f"Report not found: {report_id}")
        return {
            "reportId": report_id,
            "status": entry["status"],
            "progress": entry.get("progress", 0),
            "errorCode": entry.get("errorCode"),
            "errorMessage": entry.get("errorMessage"),
            "updatedAt": entry.get("updatedAt", _now_iso()),
        }

    data = _remote_get(f"/v1/reports/{report_id}/status")
    return {
        "reportId": str(data.get("reportId") or data.get("report_id") or report_id),
        "status": str(data.get("status", "queued")),
        "progress": int(data.get("progress", 0) or 0),
        "errorCode": data.get("errorCode") or data.get("error_code"),
        "errorMessage": data.get("errorMessage") or data.get("error_message"),
        "updatedAt": data.get("updatedAt") or data.get("updated_at") or _now_iso(),
    }


def get_report_result(report_id: str) -> dict[str, Any]:
    if settings.astro_api_mode == "mock":
        entry = MOCK_ASTRO_REPORTS.get(report_id)
        if not entry or entry.get("status") != "ready" or not entry.get("payload"):
            raise AstroClientError(
                ApiErrorCode.REPORT_GENERATION_FAILED,
                f"Report is not ready: {entry.get('status') if entry else 'missing'}",
            )
        return validate_report_payload(entry["payload"])

    data = _remote_get(f"/v1/reports/{report_id}")
    return validate_report_payload(data)
