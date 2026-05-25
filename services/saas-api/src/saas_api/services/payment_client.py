from __future__ import annotations

from datetime import datetime, timezone
from typing import Any
from urllib.parse import urlencode

import httpx

from saas_api.settings import settings


class PaymentClientError(Exception):
    def __init__(self, code: str, message: str) -> None:
        super().__init__(message)
        self.code = code
        self.message = message


MOCK_PAYMENTS: dict[str, dict[str, Any]] = {}


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _build_mock_payment_url(
    tenant_slug: str,
    order_id: str,
    payment_id: str,
    state: str = "pending",
) -> str:
    base = settings.miniapp_public_base_url.rstrip("/")
    paths = {
        "success": f"{base}/{tenant_slug}/payment/success",
        "cancel": f"{base}/{tenant_slug}/payment/cancel",
        "failed": f"{base}/{tenant_slug}/payment/failed",
        "pending": f"{base}/{tenant_slug}/payment/pending",
    }
    target = paths.get(state, paths["pending"])
    query = urlencode({"orderId": order_id, "paymentId": payment_id, "mock": state})
    sep = "&" if "?" in target else "?"
    return f"{target}{sep}{query}"


def _validate_create_response(data: dict[str, Any]) -> dict[str, Any]:
    payment_id = data.get("payment_id") or data.get("paymentId")
    payment_url = data.get("payment_url") or data.get("paymentUrl")
    if not payment_id or not payment_url:
        raise PaymentClientError(
            "payment_api_invalid_response",
            "Payment create response missing paymentId or paymentUrl",
        )
    return {
        "paymentId": str(payment_id),
        "paymentUrl": str(payment_url),
        "status": str(data.get("status", "created")),
    }


def _validate_status_response(data: dict[str, Any]) -> dict[str, Any]:
    payment_id = data.get("payment_id") or data.get("paymentId")
    order_id = data.get("order_id") or data.get("orderId")
    status = data.get("status")
    if not payment_id or not order_id or not status:
        raise PaymentClientError(
            "payment_api_invalid_response",
            "Payment status response missing required fields",
        )
    return {
        "paymentId": str(payment_id),
        "orderId": str(order_id),
        "status": str(status),
        "paidAt": data.get("paid_at") or data.get("paidAt"),
        "amount": float(data.get("amount", 0)),
        "currency": str(data.get("currency", "USD")),
        "errorCode": data.get("error_code") or data.get("errorCode"),
        "errorMessage": data.get("error_message") or data.get("errorMessage"),
    }


class PaymentClient:
    def __init__(self) -> None:
        self.mode = settings.payment_api_mode
        self.base_url = settings.payment_api_base_url.rstrip("/") if settings.payment_api_base_url else ""
        self.token = settings.payment_api_token
        self.timeout = settings.payment_api_timeout_ms / 1000

    def _headers(self) -> dict[str, str]:
        headers = {"Content-Type": "application/json"}
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        return headers

    async def create_payment(self, payload: dict[str, Any]) -> dict[str, Any]:
        if self.mode == "remote":
            if not self.base_url:
                raise PaymentClientError("missing_remote_config", "PAYMENT_API_BASE_URL is not configured")
            try:
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    res = await client.post(
                        f"{self.base_url}/v1/payments/create",
                        json={
                            "order_id": payload.get("orderId"),
                            "tenant_id": payload.get("tenantId"),
                            "user_id": payload.get("userId"),
                            "session_id": payload.get("sessionId"),
                            "product_type": payload.get("productType"),
                            "product_title": payload.get("productTitle"),
                            "amount": payload.get("amount"),
                            "currency": payload.get("currency"),
                            "success_url": payload.get("successUrl"),
                            "cancel_url": payload.get("cancelUrl"),
                            "pending_url": payload.get("pendingUrl"),
                            "metadata": payload.get("metadata"),
                        },
                        headers=self._headers(),
                    )
                    res.raise_for_status()
                    body = res.json()
            except httpx.TimeoutException as exc:
                raise PaymentClientError("payment_api_timeout", "Payment API request timed out") from exc
            except httpx.HTTPError as exc:
                raise PaymentClientError("payment_api_unavailable", "Payment API request failed") from exc
            if not isinstance(body, dict):
                raise PaymentClientError("payment_api_invalid_response", "Invalid payment create response")
            try:
                return _validate_create_response(body)
            except PaymentClientError:
                raise
            except Exception as exc:
                raise PaymentClientError("payment_create_failed", str(exc)) from exc

        tenant_slug = str(payload.get("tenantSlug") or payload.get("tenantId") or "tenant")
        order_id = str(payload.get("orderId"))
        payment_id = f"pay_{order_id}"
        payment_url = _build_mock_payment_url(tenant_slug, order_id, payment_id, "pending")
        entry = {
            "paymentId": payment_id,
            "orderId": order_id,
            "status": "pending",
            "amount": float(payload.get("amount", 0)),
            "currency": str(payload.get("currency", "USD")),
            "paymentUrl": payment_url,
            "paidAt": None,
            "errorCode": None,
            "errorMessage": None,
        }
        MOCK_PAYMENTS[payment_id] = entry
        MOCK_PAYMENTS[f"order:{order_id}"] = entry
        return {
            "paymentId": payment_id,
            "paymentUrl": payment_url,
            "status": "created",
        }

    async def get_payment_status(self, payment_id: str) -> dict[str, Any]:
        if self.mode == "remote":
            if not self.base_url:
                raise PaymentClientError("missing_remote_config", "PAYMENT_API_BASE_URL is not configured")
            try:
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    res = await client.get(
                        f"{self.base_url}/v1/payments/{payment_id}/status",
                        headers=self._headers(),
                    )
                    res.raise_for_status()
                    body = res.json()
            except httpx.TimeoutException as exc:
                raise PaymentClientError("payment_api_timeout", "Payment API request timed out") from exc
            except httpx.HTTPError as exc:
                raise PaymentClientError("payment_api_unavailable", "Payment API request failed") from exc
            if not isinstance(body, dict):
                raise PaymentClientError("payment_api_invalid_response", "Invalid payment status response")
            return _validate_status_response(body)

        entry = MOCK_PAYMENTS.get(payment_id)
        if not entry:
            raise PaymentClientError("payment_status_failed", f"Payment not found: {payment_id}")
        return {
            "paymentId": entry["paymentId"],
            "orderId": entry["orderId"],
            "status": entry["status"],
            "paidAt": entry.get("paidAt"),
            "amount": entry["amount"],
            "currency": entry["currency"],
            "errorCode": entry.get("errorCode"),
            "errorMessage": entry.get("errorMessage"),
        }

    async def sync_payment_status(self, order_id: str) -> dict[str, Any]:
        if self.mode == "remote":
            if not self.base_url:
                raise PaymentClientError("missing_remote_config", "PAYMENT_API_BASE_URL is not configured")
            try:
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    res = await client.get(
                        f"{self.base_url}/v1/orders/{order_id}/payment-status",
                        headers=self._headers(),
                    )
                    res.raise_for_status()
                    body = res.json()
            except httpx.TimeoutException as exc:
                raise PaymentClientError("payment_api_timeout", "Payment API request timed out") from exc
            except httpx.HTTPError as exc:
                raise PaymentClientError("payment_api_unavailable", "Payment API request failed") from exc
            if not isinstance(body, dict):
                raise PaymentClientError("payment_api_invalid_response", "Invalid payment status response")
            return _validate_status_response(body)

        entry = MOCK_PAYMENTS.get(f"order:{order_id}")
        if not entry:
            raise PaymentClientError("payment_status_failed", f"Payment not found for order: {order_id}")
        return await self.get_payment_status(entry["paymentId"])

    def mock_mark_paid(self, payment_id: str) -> None:
        if self.mode != "mock":
            return
        entry = MOCK_PAYMENTS.get(payment_id)
        if not entry:
            return
        entry["status"] = "paid"
        entry["paidAt"] = _now_iso()


payment_client = PaymentClient()
