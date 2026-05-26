"""007 — Telegram bot integrations table."""

from alembic import op
import sqlalchemy as sa


revision = "007_telegram_bot_integrations"
down_revision = "006_partners"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "telegram_bot_integrations",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("tenant_id", sa.String(length=64), nullable=False),
        sa.Column("mini_app_slug", sa.String(length=128), nullable=True),
        sa.Column("bot_id", sa.String(length=64), nullable=True),
        sa.Column("bot_username", sa.String(length=128), nullable=True),
        sa.Column("bot_display_name", sa.String(length=256), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("webhook_status", sa.String(length=32), nullable=False),
        sa.Column("menu_status", sa.String(length=32), nullable=False),
        sa.Column("last_validated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("error_code", sa.String(length=64), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("encrypted_token", sa.Text(), nullable=True),
        sa.Column("secret_ref", sa.String(length=256), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("tenant_id", name="uq_telegram_bot_integrations_tenant"),
    )
    op.create_index(
        "ix_telegram_bot_integrations_tenant_id",
        "telegram_bot_integrations",
        ["tenant_id"],
    )


def downgrade() -> None:
    op.drop_index("ix_telegram_bot_integrations_tenant_id", table_name="telegram_bot_integrations")
    op.drop_table("telegram_bot_integrations")
