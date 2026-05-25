"""BE-04 analytics events and media assets."""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "003_be04_analytics_media"
down_revision: Union[str, None] = "002_be03_runtime"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "analytics_events",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("tenant_id", sa.String(length=64), nullable=True),
        sa.Column("end_user_id", sa.String(length=64), nullable=True),
        sa.Column("actor_account_id", sa.String(length=64), nullable=True),
        sa.Column("session_id", sa.String(length=128), nullable=True),
        sa.Column("event_name", sa.String(length=128), nullable=False),
        sa.Column("source", sa.String(length=32), nullable=False),
        sa.Column("locale", sa.String(length=8), nullable=True),
        sa.Column("properties_json", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["actor_account_id"], ["accounts.id"]),
        sa.ForeignKeyConstraint(["end_user_id"], ["end_users.id"]),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_analytics_events_tenant_created",
        "analytics_events",
        ["tenant_id", "created_at"],
        unique=False,
    )
    op.create_index(
        "ix_analytics_events_name_created",
        "analytics_events",
        ["event_name", "created_at"],
        unique=False,
    )
    op.create_index(
        "ix_analytics_events_end_user_created",
        "analytics_events",
        ["end_user_id", "created_at"],
        unique=False,
    )
    op.create_index(
        "ix_analytics_events_actor_created",
        "analytics_events",
        ["actor_account_id", "created_at"],
        unique=False,
    )

    op.create_table(
        "media_assets",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("tenant_id", sa.String(length=64), nullable=False),
        sa.Column("uploaded_by_account_id", sa.String(length=64), nullable=True),
        sa.Column("kind", sa.String(length=32), nullable=False),
        sa.Column("storage_provider", sa.String(length=16), nullable=False),
        sa.Column("storage_key", sa.String(length=512), nullable=False),
        sa.Column("public_url", sa.String(length=1024), nullable=False),
        sa.Column("original_filename", sa.String(length=512), nullable=False),
        sa.Column("mime_type", sa.String(length=128), nullable=False),
        sa.Column("size_bytes", sa.Integer(), nullable=False),
        sa.Column("width", sa.Integer(), nullable=True),
        sa.Column("height", sa.Integer(), nullable=True),
        sa.Column("status", sa.String(length=16), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
        sa.ForeignKeyConstraint(["uploaded_by_account_id"], ["accounts.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_media_assets_tenant_kind",
        "media_assets",
        ["tenant_id", "kind"],
        unique=False,
    )
    op.create_index(
        "ix_media_assets_tenant_status",
        "media_assets",
        ["tenant_id", "status"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_media_assets_tenant_status", table_name="media_assets")
    op.drop_index("ix_media_assets_tenant_kind", table_name="media_assets")
    op.drop_table("media_assets")
    op.drop_index("ix_analytics_events_actor_created", table_name="analytics_events")
    op.drop_index("ix_analytics_events_end_user_created", table_name="analytics_events")
    op.drop_index("ix_analytics_events_name_created", table_name="analytics_events")
    op.drop_index("ix_analytics_events_tenant_created", table_name="analytics_events")
    op.drop_table("analytics_events")
