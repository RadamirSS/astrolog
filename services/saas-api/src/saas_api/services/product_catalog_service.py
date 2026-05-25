"""Server-side product catalog validation for checkout."""

from __future__ import annotations

from typing import Any

from sqlalchemy.orm import Session

from backend_common.errors import ApiErrorCode, AppError
from saas_api.services.config_service import get_published_config

APPROVED_PRODUCTS: dict[str, dict[str, Any]] = {
    "free_report": {
        "productType": "free_report",
        "level": "free",
        "price": 0.0,
        "currency": "USD",
        "purchasable": False,
    },
    "low_ticket_money": {
        "productType": "low_ticket_money",
        "level": "low_ticket",
        "theme": "money",
        "price": 29.0,
        "currency": "USD",
        "purchasable": True,
    },
    "low_ticket_relationships": {
        "productType": "low_ticket_relationships",
        "level": "low_ticket",
        "theme": "relationships",
        "price": 29.0,
        "currency": "USD",
        "purchasable": True,
    },
    "low_ticket_personality": {
        "productType": "low_ticket_personality",
        "level": "low_ticket",
        "theme": "personality",
        "price": 29.0,
        "currency": "USD",
        "purchasable": True,
    },
    "bundle_all_topics": {
        "productType": "bundle_all_topics",
        "level": "bundle",
        "price": 79.0,
        "currency": "USD",
        "purchasable": True,
    },
    "main_natal_portrait": {
        "productType": "main_natal_portrait",
        "level": "main",
        "price": 149.0,
        "currency": "USD",
        "purchasable": True,
    },
    "premium_consultation": {
        "productType": "premium_consultation",
        "level": "premium",
        "price": 0.0,
        "currency": "USD",
        "purchasable": False,
    },
}


def _catalog_for_product_type(product_type: str) -> dict[str, Any]:
    catalog = APPROVED_PRODUCTS.get(product_type)
    if not catalog:
        raise AppError(
            ApiErrorCode.PRODUCT_NOT_FOUND,
            f"Unknown product type: {product_type}",
            status_code=404,
        )
    return catalog


def resolve_checkout_product(
    db: Session,
    *,
    tenant_id: str,
    product_id: str,
    product_type: str | None = None,
) -> dict[str, Any]:
    if not product_id:
        raise AppError(ApiErrorCode.VALIDATION_ERROR, "productId is required", status_code=400)

    config = get_published_config(db, tenant_id)
    if not config:
        raise AppError(ApiErrorCode.NOT_FOUND, "No published config", status_code=404)

    tenant_product: dict[str, Any] | None = None
    for product in config.get("products", []):
        if product.get("id") == product_id:
            tenant_product = product
            break

    if not tenant_product:
        raise AppError(ApiErrorCode.PRODUCT_NOT_FOUND, "Product not found", status_code=404)

    if tenant_product.get("status") != "active":
        raise AppError(ApiErrorCode.PRODUCT_NOT_FOUND, "Product is not active", status_code=404)

    resolved_type = str(tenant_product.get("productType") or "")
    if product_type and product_type != resolved_type:
        raise AppError(
            ApiErrorCode.VALIDATION_ERROR,
            "productType does not match catalog product",
            status_code=400,
        )

    catalog = _catalog_for_product_type(resolved_type)

    if not catalog.get("purchasable"):
        raise AppError(
            ApiErrorCode.VALIDATION_ERROR,
            "Product is not available for checkout",
            status_code=400,
        )

    amount = float(catalog["price"])
    currency = str(catalog["currency"])

    return {
        "productId": product_id,
        "productType": resolved_type,
        "productTitle": str(tenant_product.get("title") or ""),
        "level": catalog.get("level"),
        "theme": tenant_product.get("theme") or catalog.get("theme"),
        "amount": amount,
        "currency": currency,
    }


def resolve_premium_product(
    db: Session,
    *,
    tenant_id: str,
    product_id: str | None = None,
) -> dict[str, Any]:
    config = get_published_config(db, tenant_id)
    if not config:
        raise AppError(ApiErrorCode.NOT_FOUND, "No published config", status_code=404)

    tenant_product: dict[str, Any] | None = None
    for product in config.get("products", []):
        if product.get("productType") == "premium_consultation" and product.get("status") == "active":
            if product_id is None or product.get("id") == product_id:
                tenant_product = product
                break

    if not tenant_product:
        raise AppError(
            ApiErrorCode.PRODUCT_NOT_FOUND,
            "Premium consultation product is not active",
            status_code=404,
        )

    catalog = _catalog_for_product_type("premium_consultation")
    return {
        "productId": tenant_product.get("id"),
        "productType": "premium_consultation",
        "productTitle": str(tenant_product.get("title") or "Premium-разбор"),
        "level": catalog.get("level"),
    }
