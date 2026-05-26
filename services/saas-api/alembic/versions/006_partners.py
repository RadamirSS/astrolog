"""Persisted partners for commission and dashboard source of truth."""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "006_partners"
down_revision: Union[str, None] = "005_finance_ledger"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "partners",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("tenant_id", sa.String(length=64), nullable=False),
        sa.Column("slug", sa.String(length=128), nullable=False),
        sa.Column("name", sa.String(length=256), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("default_commission_rate", sa.Float(), nullable=False),
        sa.Column("product_commission_rates_json", sa.JSON(), nullable=True),
        sa.Column("contact", sa.String(length=256), nullable=True),
        sa.Column("default_visual_pack", sa.String(length=64), nullable=True),
        sa.Column("default_topic", sa.String(length=64), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("tenant_id", "slug", name="uq_partner_tenant_slug"),
    )
    op.create_index("ix_partners_tenant_id", "partners", ["tenant_id"], unique=False)
    op.create_index("ix_partners_slug", "partners", ["slug"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_partners_slug", table_name="partners")
    op.drop_index("ix_partners_tenant_id", table_name="partners")
    op.drop_table("partners")
