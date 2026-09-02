"""add event circles

Revision ID: 9ac6c1ed2b31
Revises: 701d78ffded2
Create Date: 2026-09-02 10:00:00.000000

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "9ac6c1ed2b31"
down_revision = "701d78ffded2"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "event_circles",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("event_id", sa.Integer(), nullable=False),
        sa.Column("platform", sa.String(length=20), nullable=False),
        sa.Column("invite_url", sa.String(length=500), nullable=False),
        sa.Column("welcome_message", sa.String(length=500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint("platform = 'whatsapp'", name="ck_event_circles_platform"),
        sa.ForeignKeyConstraint(["event_id"], ["events.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    with op.batch_alter_table("event_circles", schema=None) as batch_op:
        batch_op.create_index(
            batch_op.f("ix_event_circles_event_id"), ["event_id"], unique=True
        )


def downgrade():
    with op.batch_alter_table("event_circles", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_event_circles_event_id"))
    op.drop_table("event_circles")
