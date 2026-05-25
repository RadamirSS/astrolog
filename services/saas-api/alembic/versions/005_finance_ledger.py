"""Finance ledger: payments, commissions, balances, payouts, ledger entries."""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "005_finance_ledger"
down_revision: Union[str, None] = "004_commerce_persistence"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("accounts", sa.Column("partner_id", sa.String(length=64), nullable=True))
    op.create_index("ix_accounts_partner_id", "accounts", ["partner_id"], unique=False)

    op.create_table(
        "payments",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("tenant_id", sa.String(length=64), nullable=False),
        sa.Column("order_id", sa.String(length=64), nullable=False),
        sa.Column("end_user_id", sa.String(length=64), nullable=False),
        sa.Column("provider", sa.String(length=64), nullable=False),
        sa.Column("external_payment_id", sa.String(length=128), nullable=False),
        sa.Column("amount", sa.Float(), nullable=False),
        sa.Column("currency", sa.String(length=8), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("method", sa.String(length=64), nullable=True),
        sa.Column("provider_fee", sa.Float(), nullable=True),
        sa.Column("platform_received_amount", sa.Float(), nullable=True),
        sa.Column("raw_provider_payload", sa.JSON(), nullable=True),
        sa.Column("error_code", sa.String(length=64), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("confirmed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("failed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("refunded_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["order_id"], ["orders.id"]),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("tenant_id", "external_payment_id", name="uq_payment_tenant_external"),
    )
    op.create_index("ix_payments_tenant_id", "payments", ["tenant_id"], unique=False)
    op.create_index("ix_payments_order_id", "payments", ["order_id"], unique=False)
    op.create_index("ix_payments_end_user_id", "payments", ["end_user_id"], unique=False)
    op.create_index("ix_payments_status", "payments", ["status"], unique=False)

    op.create_table(
        "commissions",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("tenant_id", sa.String(length=64), nullable=False),
        sa.Column("partner_id", sa.String(length=64), nullable=False),
        sa.Column("order_id", sa.String(length=64), nullable=False),
        sa.Column("payment_id", sa.String(length=64), nullable=True),
        sa.Column("product_type", sa.String(length=64), nullable=False),
        sa.Column("gross_amount", sa.Float(), nullable=False),
        sa.Column("currency", sa.String(length=8), nullable=False),
        sa.Column("commission_rate", sa.Float(), nullable=False),
        sa.Column("commission_amount", sa.Float(), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("hold_until", sa.DateTime(timezone=True), nullable=True),
        sa.Column("available_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("paid_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("cancelled_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("adjustment_reason", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["order_id"], ["orders.id"]),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("order_id", name="uq_commission_order"),
    )
    op.create_index("ix_commissions_tenant_id", "commissions", ["tenant_id"], unique=False)
    op.create_index("ix_commissions_partner_id", "commissions", ["partner_id"], unique=False)
    op.create_index("ix_commissions_payment_id", "commissions", ["payment_id"], unique=False)
    op.create_index("ix_commissions_status", "commissions", ["status"], unique=False)

    op.create_table(
        "partner_balances",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("tenant_id", sa.String(length=64), nullable=False),
        sa.Column("partner_id", sa.String(length=64), nullable=False),
        sa.Column("currency", sa.String(length=8), nullable=False),
        sa.Column("pending_balance", sa.Float(), nullable=False, server_default="0"),
        sa.Column("available_balance", sa.Float(), nullable=False, server_default="0"),
        sa.Column("on_hold_balance", sa.Float(), nullable=False, server_default="0"),
        sa.Column("paid_out_total", sa.Float(), nullable=False, server_default="0"),
        sa.Column("adjusted_total", sa.Float(), nullable=False, server_default="0"),
        sa.Column("refunded_total", sa.Float(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("tenant_id", "partner_id", "currency", name="uq_partner_balance"),
    )
    op.create_index("ix_partner_balances_tenant_id", "partner_balances", ["tenant_id"], unique=False)
    op.create_index("ix_partner_balances_partner_id", "partner_balances", ["partner_id"], unique=False)

    op.create_table(
        "payouts",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("tenant_id", sa.String(length=64), nullable=False),
        sa.Column("partner_id", sa.String(length=64), nullable=False),
        sa.Column("currency", sa.String(length=8), nullable=False),
        sa.Column("amount", sa.Float(), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("period_start", sa.DateTime(timezone=True), nullable=True),
        sa.Column("period_end", sa.DateTime(timezone=True), nullable=True),
        sa.Column("method", sa.String(length=32), nullable=False),
        sa.Column("provider", sa.String(length=64), nullable=True),
        sa.Column("external_payout_id", sa.String(length=128), nullable=True),
        sa.Column("failure_reason", sa.Text(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_by_admin_id", sa.String(length=64), nullable=True),
        sa.Column("approved_by_admin_id", sa.String(length=64), nullable=True),
        sa.Column("paid_by_admin_id", sa.String(length=64), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("approved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("paid_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("failed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("cancelled_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_payouts_tenant_id", "payouts", ["tenant_id"], unique=False)
    op.create_index("ix_payouts_partner_id", "payouts", ["partner_id"], unique=False)
    op.create_index("ix_payouts_status", "payouts", ["status"], unique=False)

    op.create_table(
        "payout_methods",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("tenant_id", sa.String(length=64), nullable=False),
        sa.Column("partner_id", sa.String(length=64), nullable=False),
        sa.Column("type", sa.String(length=32), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("display_name", sa.String(length=256), nullable=True),
        sa.Column("masked_details", sa.String(length=512), nullable=True),
        sa.Column("external_token", sa.String(length=256), nullable=True),
        sa.Column("admin_note", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("verified_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_payout_methods_tenant_id", "payout_methods", ["tenant_id"], unique=False)
    op.create_index("ix_payout_methods_partner_id", "payout_methods", ["partner_id"], unique=False)

    op.create_table(
        "ledger_entries",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("tenant_id", sa.String(length=64), nullable=False),
        sa.Column("partner_id", sa.String(length=64), nullable=True),
        sa.Column("order_id", sa.String(length=64), nullable=True),
        sa.Column("payment_id", sa.String(length=64), nullable=True),
        sa.Column("commission_id", sa.String(length=64), nullable=True),
        sa.Column("payout_id", sa.String(length=64), nullable=True),
        sa.Column("type", sa.String(length=64), nullable=False),
        sa.Column("direction", sa.String(length=16), nullable=False),
        sa.Column("amount", sa.Float(), nullable=False),
        sa.Column("currency", sa.String(length=8), nullable=False),
        sa.Column("status", sa.String(length=16), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("metadata_json", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_by", sa.String(length=64), nullable=True),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_ledger_entries_tenant_id", "ledger_entries", ["tenant_id"], unique=False)
    op.create_index("ix_ledger_entries_partner_id", "ledger_entries", ["partner_id"], unique=False)
    op.create_index("ix_ledger_entries_order_id", "ledger_entries", ["order_id"], unique=False)
    op.create_index("ix_ledger_entries_payment_id", "ledger_entries", ["payment_id"], unique=False)
    op.create_index("ix_ledger_entries_commission_id", "ledger_entries", ["commission_id"], unique=False)
    op.create_index("ix_ledger_entries_payout_id", "ledger_entries", ["payout_id"], unique=False)
    op.create_index("ix_ledger_entries_type", "ledger_entries", ["type"], unique=False)
    op.create_index("ix_ledger_entries_created_at", "ledger_entries", ["created_at"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_ledger_entries_created_at", table_name="ledger_entries")
    op.drop_index("ix_ledger_entries_type", table_name="ledger_entries")
    op.drop_index("ix_ledger_entries_payout_id", table_name="ledger_entries")
    op.drop_index("ix_ledger_entries_commission_id", table_name="ledger_entries")
    op.drop_index("ix_ledger_entries_payment_id", table_name="ledger_entries")
    op.drop_index("ix_ledger_entries_order_id", table_name="ledger_entries")
    op.drop_index("ix_ledger_entries_partner_id", table_name="ledger_entries")
    op.drop_index("ix_ledger_entries_tenant_id", table_name="ledger_entries")
    op.drop_table("ledger_entries")

    op.drop_index("ix_payout_methods_partner_id", table_name="payout_methods")
    op.drop_index("ix_payout_methods_tenant_id", table_name="payout_methods")
    op.drop_table("payout_methods")

    op.drop_index("ix_payouts_status", table_name="payouts")
    op.drop_index("ix_payouts_partner_id", table_name="payouts")
    op.drop_index("ix_payouts_tenant_id", table_name="payouts")
    op.drop_table("payouts")

    op.drop_index("ix_partner_balances_partner_id", table_name="partner_balances")
    op.drop_index("ix_partner_balances_tenant_id", table_name="partner_balances")
    op.drop_table("partner_balances")

    op.drop_index("ix_commissions_status", table_name="commissions")
    op.drop_index("ix_commissions_payment_id", table_name="commissions")
    op.drop_index("ix_commissions_partner_id", table_name="commissions")
    op.drop_index("ix_commissions_tenant_id", table_name="commissions")
    op.drop_table("commissions")

    op.drop_index("ix_payments_status", table_name="payments")
    op.drop_index("ix_payments_end_user_id", table_name="payments")
    op.drop_index("ix_payments_order_id", table_name="payments")
    op.drop_index("ix_payments_tenant_id", table_name="payments")
    op.drop_table("payments")

    op.drop_index("ix_accounts_partner_id", table_name="accounts")
    op.drop_column("accounts", "partner_id")
