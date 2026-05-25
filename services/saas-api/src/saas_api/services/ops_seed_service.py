"""Static pilot ops seed data for remote dashboard mode."""

from __future__ import annotations

from typing import Any

BASE_TS = "2026-05-01T10:00:00.000Z"

MOCK_PARTNERS: list[dict[str, Any]] = [
    {
        "id": "partner_nicole",
        "tenantId": "tenant_mystic",
        "name": "Nicole Astrology",
        "slug": "nicole",
        "status": "active",
        "commissionRate": 0.5,
        "defaultVisualPack": "pink_love",
        "defaultTopic": "relationships",
        "contact": "nicole@example.com",
        "createdAt": BASE_TS,
        "clicks": 1240,
        "leads": 380,
        "freeReports": 290,
        "paidOrders": 42,
        "revenue": 2180,
        "commission": 1090,
        "unpaidCommission": 320,
        "activeProductTypes": [
            "free_report",
            "low_ticket_relationships",
            "bundle_all_topics",
            "premium_consultation",
        ],
    },
    {
        "id": "partner_luna",
        "tenantId": "tenant_mystic",
        "name": "Luna Guide",
        "slug": "luna-guide",
        "status": "active",
        "commissionRate": 0.4,
        "defaultVisualPack": "dark_gold_mystic",
        "defaultTopic": "money",
        "contact": "luna@example.com",
        "createdAt": BASE_TS,
        "clicks": 890,
        "leads": 210,
        "freeReports": 175,
        "paidOrders": 28,
        "revenue": 1420,
        "commission": 568,
        "unpaidCommission": 180,
        "activeProductTypes": [
            "free_report",
            "low_ticket_money",
            "main_natal_portrait",
            "premium_consultation",
        ],
    },
    {
        "id": "partner_mira",
        "tenantId": "tenant_mystic",
        "name": "Astro Mira",
        "slug": "astro-mira",
        "status": "paused",
        "commissionRate": 0.35,
        "defaultVisualPack": "sky_clarity",
        "contact": "mira@example.com",
        "createdAt": BASE_TS,
        "clicks": 420,
        "leads": 95,
        "freeReports": 72,
        "paidOrders": 11,
        "revenue": 520,
        "commission": 182,
        "unpaidCommission": 45,
        "activeProductTypes": ["free_report", "premium_consultation"],
    },
]

MOCK_COMMISSIONS: list[dict[str, Any]] = [
    {
        "id": "comm_001",
        "tenantId": "tenant_mystic",
        "orderId": "ord_seed_001",
        "partnerId": "partner_nicole",
        "partnerName": "Nicole Astrology",
        "productTitle": "Полный астрологический портрет",
        "grossAmount": 149.0,
        "commissionRate": 0.5,
        "commissionAmount": 74.5,
        "status": "approved",
        "createdAt": BASE_TS,
    }
]

MOCK_PAYOUTS: list[dict[str, Any]] = [
    {
        "id": "payout_001",
        "tenantId": "tenant_mystic",
        "partnerId": "partner_nicole",
        "partnerName": "Nicole Astrology",
        "amount": 320.0,
        "currency": "USD",
        "status": "pending",
        "createdAt": BASE_TS,
        "notes": None,
    }
]

MOCK_PROMO_MATERIALS: list[dict[str, Any]] = [
    {
        "id": "promo_001",
        "tenantId": "tenant_mystic",
        "partnerId": "partner_nicole",
        "title": "Instagram Story Pack",
        "type": "story",
        "copy": "Узнайте свой код отношений — бесплатный мини-разбор уже ждёт.",
        "createdAt": BASE_TS,
    }
]


def list_partners(tenant_id: str) -> list[dict[str, Any]]:
    return [p for p in MOCK_PARTNERS if p["tenantId"] == tenant_id]


def get_partner(tenant_id: str, partner_id: str) -> dict[str, Any] | None:
    for partner in MOCK_PARTNERS:
        if partner["tenantId"] == tenant_id and partner["id"] == partner_id:
            return {
                **partner,
                "recentOrders": [],
                "commissionSummary": {
                    "pending": 0,
                    "available": partner.get("unpaidCommission", 0),
                    "onHold": 0,
                    "approved": partner["commission"],
                    "paid": 0,
                    "adjusted": 0,
                    "cancelled": 0,
                },
                "bestProduct": "Полный астрологический портрет",
                "bestTopic": "relationships",
            }
    return None


def get_partner_link_sets(tenant_id: str, base_url: str | None = None) -> list[dict[str, Any]]:
    partners = list_partners(tenant_id)
    return [
        {
            "partnerId": partner["id"],
            "partnerName": partner["name"],
            "partnerSlug": partner["slug"],
            "general": f"/b/{partner['slug']}",
            "money": f"/b/{partner['slug']}/money",
            "relationships": f"/b/{partner['slug']}/relationships",
            "personality": f"/b/{partner['slug']}/personality",
        }
        for partner in partners
    ]


def list_commissions(tenant_id: str) -> list[dict[str, Any]]:
    return [c for c in MOCK_COMMISSIONS if c["tenantId"] == tenant_id]


def get_commission_summary(tenant_id: str) -> dict[str, Any]:
    commissions = list_commissions(tenant_id)
    summary = {
        "pending": 0.0,
        "approved": 0.0,
        "payable": 0.0,
        "paid": 0.0,
        "adjusted": 0.0,
        "cancelled": 0.0,
    }
    for commission in commissions:
        status = commission["status"]
        amount = commission["commissionAmount"]
        if status in summary:
            summary[status] += amount
    return summary


def list_payouts(tenant_id: str) -> list[dict[str, Any]]:
    return [p for p in MOCK_PAYOUTS if p["tenantId"] == tenant_id]


def update_payout(tenant_id: str, payout_id: str, update: dict[str, Any]) -> dict[str, Any] | None:
    for payout in MOCK_PAYOUTS:
        if payout["tenantId"] == tenant_id and payout["id"] == payout_id:
            if "status" in update and update["status"]:
                payout["status"] = update["status"]
            if "notes" in update:
                payout["notes"] = update["notes"]
            return payout
    return None


def list_promo_materials(tenant_id: str, partner_id: str | None = None) -> list[dict[str, Any]]:
    items = [p for p in MOCK_PROMO_MATERIALS if p["tenantId"] == tenant_id]
    if partner_id:
        items = [p for p in items if p.get("partnerId") == partner_id]
    return items


def get_product_economics(tenant_id: str) -> list[dict[str, Any]]:
    if tenant_id != "tenant_mystic":
        return []
    return [
        {
            "productName": "Полный астрологический портрет",
            "grossRevenue": 2180.0,
            "partnerCommission": 1090.0,
            "estimatedApiCost": 120.0,
            "netRevenue": 970.0,
        }
    ]


def get_funnel_analytics(tenant_id: str) -> dict[str, Any]:
    return {
        "stages": [
            {"stage": "clicks", "count": 2130},
            {"stage": "leads", "count": 590},
            {"stage": "freeReports", "count": 465},
            {"stage": "paidOrders", "count": 70},
        ],
        "byPartner": [],
        "byProduct": [],
        "byTheme": [],
        "byVisualPack": [],
    }
