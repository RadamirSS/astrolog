"""Platform catalog price normalization for tenant config saves."""

from __future__ import annotations

from typing import Any

from saas_api.services.approved_product_catalog import APPROVED_PRODUCTS, CATALOG_PRICE_LABELS


def normalize_creator_product_prices(config: dict[str, Any]) -> dict[str, Any]:
    """Force platform catalog prices for non-admin config saves."""
    products = config.get("products") or []
    for product in products:
        ptype = str(product.get("productType") or "")
        catalog = APPROVED_PRODUCTS.get(ptype)
        if not catalog:
            continue
        product["price"] = catalog["price"]
        product["currency"] = catalog["currency"]
        label = CATALOG_PRICE_LABELS.get(ptype)
        if label:
            product["priceLabel"] = label
    config["products"] = products
    return config
