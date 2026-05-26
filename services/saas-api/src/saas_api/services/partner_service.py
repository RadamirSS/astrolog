"""Persisted partner records for commission rates and dashboard ops."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from sqlalchemy.orm import Session

from saas_api.auth.passwords import new_id
from saas_api.db.models.partner import Partner, PartnerStatus
from saas_api.settings import settings


def _iso(dt: datetime | None) -> str:
    if dt is None:
        return datetime.now(UTC).isoformat().replace("+00:00", "Z")
    return dt.isoformat().replace("+00:00", "Z")


def partner_to_dict(partner: Partner) -> dict[str, Any]:
    return {
        "id": partner.id,
        "tenantId": partner.tenant_id,
        "name": partner.name,
        "slug": partner.slug,
        "status": partner.status,
        "commissionRate": partner.default_commission_rate,
        "defaultVisualPack": partner.default_visual_pack or "brand_default",
        "defaultTopic": partner.default_topic,
        "contact": partner.contact,
        "createdAt": _iso(partner.created_at),
    }


def list_partners_db(db: Session, tenant_id: str) -> list[dict[str, Any]]:
    rows = (
        db.query(Partner)
        .filter(Partner.tenant_id == tenant_id)
        .order_by(Partner.created_at.asc())
        .all()
    )
    return [partner_to_dict(row) for row in rows]


def get_partner_db(db: Session, tenant_id: str, partner_id: str) -> dict[str, Any] | None:
    row = (
        db.query(Partner)
        .filter(Partner.tenant_id == tenant_id, Partner.id == partner_id)
        .first()
    )
    if not row:
        return None
    data = partner_to_dict(row)
    data["recentOrders"] = []
    data["commissionSummary"] = {
        "pending": 0,
        "available": 0,
        "onHold": 0,
        "approved": 0,
        "paid": 0,
        "adjusted": 0,
        "cancelled": 0,
    }
    return data


def get_partner_name(db: Session, tenant_id: str, partner_id: str) -> str | None:
    row = (
        db.query(Partner)
        .filter(Partner.tenant_id == tenant_id, Partner.id == partner_id)
        .first()
    )
    return row.name if row else None


def get_commission_rate(
    db: Session, tenant_id: str, partner_id: str, product_type: str
) -> float:
    row = (
        db.query(Partner)
        .filter(Partner.tenant_id == tenant_id, Partner.id == partner_id)
        .first()
    )
    if not row:
        return settings.platform_default_commission_rate
    overrides = row.product_commission_rates_json or {}
    if product_type in overrides:
        return float(overrides[product_type])
    return float(row.default_commission_rate)


def ensure_partner_from_config(
    db: Session,
    tenant_id: str,
    mini_app: dict[str, Any],
    *,
    brand: dict[str, Any] | None = None,
) -> Partner | None:
    partner_id = str(mini_app.get("partnerId") or "").strip()
    if not partner_id:
        partner_id = f"partner_{tenant_id}"

    slug = str(mini_app.get("partnerSlug") or mini_app.get("publicSlug") or partner_id).strip()
    name = str(
        mini_app.get("partnerName")
        or (brand or {}).get("displayName")
        or (brand or {}).get("name")
        or slug
    ).strip()
    partner_status = str(mini_app.get("partnerStatus") or "active")
    status = PartnerStatus.ACTIVE if partner_status == "active" else PartnerStatus.PAUSED

    existing = (
        db.query(Partner)
        .filter(Partner.tenant_id == tenant_id, Partner.id == partner_id)
        .first()
    )
    now = datetime.now(UTC)
    if existing:
        existing.slug = slug or existing.slug
        existing.name = name or existing.name
        existing.status = status
        existing.default_visual_pack = mini_app.get("visualPack") or existing.default_visual_pack
        existing.default_topic = mini_app.get("defaultTopic") or existing.default_topic
        existing.updated_at = now
        return existing

    partner = Partner(
        id=partner_id,
        tenant_id=tenant_id,
        slug=slug,
        name=name,
        status=status,
        default_commission_rate=settings.platform_default_commission_rate,
        product_commission_rates_json=None,
        contact=None,
        default_visual_pack=mini_app.get("visualPack"),
        default_topic=mini_app.get("defaultTopic"),
        created_at=now,
        updated_at=now,
    )
    db.add(partner)
    db.flush()
    return partner


def seed_demo_partners(db: Session, tenant_id: str = "tenant_mystic") -> None:
    """Bootstrap demo partners from explicit seed data (dev/demo only)."""
    from saas_api.services import ops_seed_service

    for seed in ops_seed_service.MOCK_PARTNERS:
        if seed["tenantId"] != tenant_id:
            continue
        partner_id = seed["id"]
        existing = db.get(Partner, partner_id)
        now = datetime.now(UTC)
        if existing:
            existing.default_commission_rate = float(seed.get("commissionRate", 0.5))
            existing.name = seed["name"]
            existing.slug = seed["slug"]
            existing.status = seed.get("status", PartnerStatus.ACTIVE)
            existing.default_visual_pack = seed.get("defaultVisualPack")
            existing.default_topic = seed.get("defaultTopic")
            existing.updated_at = now
            continue
        db.add(
            Partner(
                id=partner_id,
                tenant_id=tenant_id,
                slug=seed["slug"],
                name=seed["name"],
                status=seed.get("status", PartnerStatus.ACTIVE),
                default_commission_rate=float(seed.get("commissionRate", 0.5)),
                product_commission_rates_json=seed.get("productCommissionRates"),
                contact=seed.get("contact"),
                default_visual_pack=seed.get("defaultVisualPack"),
                default_topic=seed.get("defaultTopic"),
                created_at=now,
                updated_at=now,
            )
        )
    db.flush()
