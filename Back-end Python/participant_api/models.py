import uuid

from sqlalchemy import DateTime, String, Text, Uuid, func

from .extensions import db


class Participant(db.Model):
    __tablename__ = "participants"
    __table_args__ = {"schema": "participants"}

    id = db.Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nom = db.Column(String(120), nullable=False)
    email = db.Column(String(255), nullable=False, unique=True, index=True)
    password_hash = db.Column(Text, nullable=False)
    created_at = db.Column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
