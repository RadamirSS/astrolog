"""Product economics computed from persisted orders and finance data."""

from __future__ import annotations

from typing import Any

from sqlalchemy.orm import Session

from saas_api.db.models.commission import Commission
from saas_api.db.models.order import Order
from saas_api.db.models.payment import Payment
from saas_api.services import ops_seed_service


def compute_product_economics(db: Session, tenant_id: str) -> list[dict[str, Any]]:
    paid_orders = (
        db.query(Order)
        .filter(Order.tenant_id == tenant_id, Order.status == "paid", Order.amount > 0)
        .all()
    )
    if not paid_orders:
        return ops_seed_service.get_product_economics(tenant_id)

    commissions = (
        db.query(Commission).filter(Commission.tenant_id == tenant_id).all()
    )
    commission_by_order = {c.order_id: c for c in commissions}

    payments = db.query(Payment).filter(Payment.tenant_id == tenant_id).all()
    provider_fee_by_order = {p.order_id: (p.provider_fee or 0) for p in payments}

    buckets: dict[str, dict[str, Any]] = {}
    for order in paid_orders:
        key = order.product_type
        bucket = buckets.setdefault(
            key,
            {
                "productType": order.product_type,
                "productName": order.product_title,
                "price": order.amount,
                "salesCount": 0,
                "grossRevenue": 0.0,
                "partnerCommission": 0.0,
                "providerFees": 0.0,
                "refundAmount": 0.0,
                "estimatedApiCost": 0.0,
                "grossProfitEstimate": 0.0,
                "conversionRate": None,
            },
        )
        bucket["salesCount"] += 1
        bucket["grossRevenue"] += order.amount
        comm = commission_by_order.get(order.id)
        if comm:
            bucket["partnerCommission"] += comm.commission_amount
        bucket["providerFees"] += provider_fee_by_order.get(order.id, 0)
        if order.status == "refunded":
            bucket["refundAmount"] += order.amount

    for bucket in buckets.values():
        bucket["grossRevenue"] = round(bucket["grossRevenue"], 2)
        bucket["partnerCommission"] = round(bucket["partnerCommission"], 2)
        bucket["providerFees"] = round(bucket["providerFees"], 2)
        bucket["estimatedApiCost"] = round(bucket["salesCount"] * 2.5, 2)
        bucket["grossProfitEstimate"] = round(
            bucket["grossRevenue"]
            - bucket["partnerCommission"]
            - bucket["providerFees"]
            - bucket["estimatedApiCost"]
            - bucket["refundAmount"],
            2,
        )

    return list(buckets.values())
