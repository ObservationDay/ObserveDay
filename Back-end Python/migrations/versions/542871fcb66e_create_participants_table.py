"""create participants table

Revision ID: 542871fcb66e
Revises: 
Create Date: 2026-11-17 12:36:40.532461

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '542871fcb66e'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    if op.get_bind().dialect.name == "postgresql":
        op.execute(sa.text("CREATE SCHEMA IF NOT EXISTS participants"))

    op.create_table(
        "participants",
        sa.Column("id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("nom", sa.String(length=120), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.Text(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        schema="participants",
    )
    op.create_index(
        "ix_participants_participants_email",
        "participants",
        ["email"],
        unique=True,
        schema="participants",
    )


def downgrade():
    op.drop_index(
        "ix_participants_participants_email",
        table_name="participants",
        schema="participants",
    )
    op.drop_table("participants", schema="participants")
