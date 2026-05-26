"""Approved MVP product catalog constants (server source of truth)."""

from __future__ import annotations

from typing import Any

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
        "priceLabel": "Request",
        "purchasable": False,
    },
}

CATALOG_PRICE_LABELS: dict[str, str] = {
    "free_report": "$0",
    "low_ticket_money": "$29",
    "low_ticket_relationships": "$29",
    "low_ticket_personality": "$29",
    "bundle_all_topics": "$79",
    "main_natal_portrait": "$149",
    "premium_consultation": "Request",
}
