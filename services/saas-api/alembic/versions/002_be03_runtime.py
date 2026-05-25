"""BE-03 end users, birth profiles, reports."""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "002_be03_runtime"
down_revision: Union[str, None] = "001_initial"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "end_users",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("tenant_id", sa.String(length=64), nullable=False),
        sa.Column("telegram_id", sa.String(length=64), nullable=False),
        sa.Column("telegram_username", sa.String(length=128), nullable=True),
        sa.Column("first_name", sa.String(length=128), nullable=True),
        sa.Column("last_name", sa.String(length=128), nullable=True),
        sa.Column("language_code", sa.String(length=16), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("last_seen_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("tenant_id", "telegram_id", name="uq_end_user_tenant_telegram"),
    )
    op.create_index("ix_end_users_tenant_id", "end_users", ["tenant_id"], unique=False)
    op.create_index("ix_end_users_telegram_id", "end_users", ["telegram_id"], unique=False)

    op.create_table(
        "birth_profiles",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("tenant_id", sa.String(length=64), nullable=False),
        sa.Column("end_user_id", sa.String(length=64), nullable=False),
        sa.Column("name", sa.String(length=256), nullable=False),
        sa.Column("birth_date", sa.String(length=32), nullable=False),
        sa.Column("birth_time", sa.String(length=16), nullable=True),
        sa.Column("birth_city", sa.String(length=256), nullable=False),
        sa.Column("topic", sa.String(length=64), nullable=False),
        sa.Column("locale", sa.String(length=8), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["end_user_id"], ["end_users.id"]),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_birth_profiles_tenant_id", "birth_profiles", ["tenant_id"], unique=False)
    op.create_index("ix_birth_profiles_end_user_id", "birth_profiles", ["end_user_id"], unique=False)

    op.create_table(
        "reports",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("tenant_id", sa.String(length=64), nullable=False),
        sa.Column("end_user_id", sa.String(length=64), nullable=False),
        sa.Column("birth_profile_id", sa.String(length=64), nullable=True),
        sa.Column("report_type", sa.String(length=32), nullable=False),
        sa.Column("status", sa.String(length=16), nullable=False),
        sa.Column("locale", sa.String(length=8), nullable=False),
        sa.Column("request_json", sa.JSON(), nullable=False),
        sa.Column("report_json", sa.JSON(), nullable=True),
        sa.Column("error_code", sa.String(length=64), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["birth_profile_id"], ["birth_profiles.id"]),
        sa.ForeignKeyConstraint(["end_user_id"], ["end_users.id"]),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_reports_tenant_id", "reports", ["tenant_id"], unique=False)
    op.create_index("ix_reports_end_user_id", "reports", ["end_user_id"], unique=False)
    op.create_index("ix_reports_status", "reports", ["status"], unique=False)
    op.create_index("ix_reports_created_at", "reports", ["created_at"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_reports_created_at", table_name="reports")
    op.drop_index("ix_reports_status", table_name="reports")
    op.drop_index("ix_reports_end_user_id", table_name="reports")
    op.drop_index("ix_reports_tenant_id", table_name="reports")
    op.drop_table("reports")
    op.drop_index("ix_birth_profiles_end_user_id", table_name="birth_profiles")
    op.drop_index("ix_birth_profiles_tenant_id", table_name="birth_profiles")
    op.drop_table("birth_profiles")
    op.drop_index("ix_end_users_telegram_id", table_name="end_users")
    op.drop_index("ix_end_users_tenant_id", table_name="end_users")
    op.drop_table("end_users")
