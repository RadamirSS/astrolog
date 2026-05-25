"""Commerce persistence: orders, entitlements, premium requests, order events."""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "004_commerce_persistence"
down_revision: Union[str, None] = "003_be04_analytics_media"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "orders",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("tenant_id", sa.String(length=64), nullable=False),
        sa.Column("end_user_id", sa.String(length=64), nullable=False),
        sa.Column("session_id", sa.String(length=128), nullable=True),
        sa.Column("product_id", sa.String(length=128), nullable=True),
        sa.Column("product_type", sa.String(length=64), nullable=False),
        sa.Column("product_title", sa.String(length=256), nullable=False),
        sa.Column("theme", sa.String(length=32), nullable=True),
        sa.Column("amount", sa.Float(), nullable=False),
        sa.Column("currency", sa.String(length=8), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("payment_status", sa.String(length=32), nullable=False),
        sa.Column("report_status", sa.String(length=32), nullable=False),
        sa.Column("entitlement_id", sa.String(length=64), nullable=True),
        sa.Column("entitlement_status", sa.String(length=32), nullable=True),
        sa.Column("external_payment_id", sa.String(length=128), nullable=True),
        sa.Column("external_report_id", sa.String(length=128), nullable=True),
        sa.Column("payment_url", sa.String(length=1024), nullable=True),
        sa.Column("partner_id", sa.String(length=64), nullable=True),
        sa.Column("partner_slug", sa.String(length=128), nullable=True),
        sa.Column("campaign_id", sa.String(length=128), nullable=True),
        sa.Column("birth_context", sa.JSON(), nullable=True),
        sa.Column("needs_review", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("report_error_code", sa.String(length=64), nullable=True),
        sa.Column("report_error_message", sa.Text(), nullable=True),
        sa.Column("report_progress", sa.Integer(), nullable=True),
        sa.Column("admin_notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("paid_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("refunded_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_sync_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["end_user_id"], ["end_users.id"]),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_orders_tenant_id", "orders", ["tenant_id"], unique=False)
    op.create_index("ix_orders_end_user_id", "orders", ["end_user_id"], unique=False)
    op.create_index("ix_orders_product_type", "orders", ["product_type"], unique=False)
    op.create_index("ix_orders_status", "orders", ["status"], unique=False)
    op.create_index("ix_orders_created_at", "orders", ["created_at"], unique=False)

    op.create_table(
        "entitlements",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("tenant_id", sa.String(length=64), nullable=False),
        sa.Column("end_user_id", sa.String(length=64), nullable=False),
        sa.Column("session_id", sa.String(length=128), nullable=True),
        sa.Column("order_id", sa.String(length=64), nullable=False),
        sa.Column("product_type", sa.String(length=64), nullable=False),
        sa.Column("report_id", sa.String(length=128), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("granted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["end_user_id"], ["end_users.id"]),
        sa.ForeignKeyConstraint(["order_id"], ["orders.id"]),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_entitlements_tenant_id", "entitlements", ["tenant_id"], unique=False)
    op.create_index("ix_entitlements_end_user_id", "entitlements", ["end_user_id"], unique=False)
    op.create_index("ix_entitlements_order_id", "entitlements", ["order_id"], unique=False)
    op.create_index("ix_entitlements_status", "entitlements", ["status"], unique=False)

    op.create_table(
        "premium_requests",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("tenant_id", sa.String(length=64), nullable=False),
        sa.Column("end_user_id", sa.String(length=64), nullable=True),
        sa.Column("session_id", sa.String(length=128), nullable=True),
        sa.Column("order_id", sa.String(length=64), nullable=True),
        sa.Column("product_id", sa.String(length=128), nullable=True),
        sa.Column("product_type", sa.String(length=64), nullable=False),
        sa.Column("product_title", sa.String(length=256), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("topic", sa.String(length=32), nullable=True),
        sa.Column("personal_question", sa.Text(), nullable=True),
        sa.Column("context", sa.Text(), nullable=True),
        sa.Column("contact_method", sa.String(length=64), nullable=True),
        sa.Column("contact_value", sa.String(length=256), nullable=True),
        sa.Column("desired_window", sa.String(length=256), nullable=True),
        sa.Column("consent_accepted", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("birth_profile", sa.JSON(), nullable=True),
        sa.Column("assigned_expert", sa.String(length=256), nullable=True),
        sa.Column("admin_notes", sa.JSON(), nullable=True),
        sa.Column("final_pdf_url", sa.String(length=1024), nullable=True),
        sa.Column("timeline", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("submitted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["end_user_id"], ["end_users.id"]),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_premium_requests_tenant_id", "premium_requests", ["tenant_id"], unique=False)
    op.create_index(
        "ix_premium_requests_end_user_id", "premium_requests", ["end_user_id"], unique=False
    )
    op.create_index("ix_premium_requests_status", "premium_requests", ["status"], unique=False)
    op.create_index(
        "ix_premium_requests_created_at", "premium_requests", ["created_at"], unique=False
    )

    op.create_table(
        "order_events",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("tenant_id", sa.String(length=64), nullable=False),
        sa.Column("entity_type", sa.String(length=32), nullable=False),
        sa.Column("entity_id", sa.String(length=64), nullable=False),
        sa.Column("event_type", sa.String(length=64), nullable=False),
        sa.Column("payload_json", sa.JSON(), nullable=True),
        sa.Column("actor_account_id", sa.String(length=64), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["actor_account_id"], ["accounts.id"]),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_order_events_tenant_id", "order_events", ["tenant_id"], unique=False)
    op.create_index("ix_order_events_entity_id", "order_events", ["entity_id"], unique=False)
    op.create_index("ix_order_events_created_at", "order_events", ["created_at"], unique=False)

    op.add_column("reports", sa.Column("order_id", sa.String(length=64), nullable=True))
    op.add_column("reports", sa.Column("entitlement_id", sa.String(length=64), nullable=True))
    op.add_column("reports", sa.Column("product_type", sa.String(length=64), nullable=True))
    op.add_column("reports", sa.Column("theme", sa.String(length=32), nullable=True))
    op.add_column("reports", sa.Column("pdf_url", sa.String(length=1024), nullable=True))
    op.create_index("ix_reports_order_id", "reports", ["order_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_reports_order_id", table_name="reports")
    op.drop_column("reports", "pdf_url")
    op.drop_column("reports", "theme")
    op.drop_column("reports", "product_type")
    op.drop_column("reports", "entitlement_id")
    op.drop_column("reports", "order_id")

    op.drop_index("ix_order_events_created_at", table_name="order_events")
    op.drop_index("ix_order_events_entity_id", table_name="order_events")
    op.drop_index("ix_order_events_tenant_id", table_name="order_events")
    op.drop_table("order_events")

    op.drop_index("ix_premium_requests_created_at", table_name="premium_requests")
    op.drop_index("ix_premium_requests_status", table_name="premium_requests")
    op.drop_index("ix_premium_requests_end_user_id", table_name="premium_requests")
    op.drop_index("ix_premium_requests_tenant_id", table_name="premium_requests")
    op.drop_table("premium_requests")

    op.drop_index("ix_entitlements_status", table_name="entitlements")
    op.drop_index("ix_entitlements_order_id", table_name="entitlements")
    op.drop_index("ix_entitlements_end_user_id", table_name="entitlements")
    op.drop_index("ix_entitlements_tenant_id", table_name="entitlements")
    op.drop_table("entitlements")

    op.drop_index("ix_orders_created_at", table_name="orders")
    op.drop_index("ix_orders_status", table_name="orders")
    op.drop_index("ix_orders_product_type", table_name="orders")
    op.drop_index("ix_orders_end_user_id", table_name="orders")
    op.drop_index("ix_orders_tenant_id", table_name="orders")
    op.drop_table("orders")
