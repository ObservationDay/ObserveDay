from uuid import UUID

from email_validator import EmailNotValidError, validate_email
from flask import Blueprint, jsonify, request
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required
from sqlalchemy.exc import IntegrityError
from werkzeug.security import check_password_hash, generate_password_hash

from .extensions import db
from .laravel_client import request_laravel
from .models import Participant

api = Blueprint("api", __name__, url_prefix="/api/v1")


def _participant_json(participant):
    return {
        "id": str(participant.id),
        "nom": participant.nom,
        "email": participant.email,
        "created_at": participant.created_at.isoformat()
        if participant.created_at
        else None,
    }


def _participant_access_token(participant):
    return create_access_token(
        identity=str(participant.id),
        additional_claims={
            "participant_name": participant.nom,
            "participant_email": participant.email,
        },
    )


def _validation_error(errors):
    return (
        jsonify({"message": "The given data was invalid.", "errors": errors}),
        422,
    )


def _validated_email(value):
    if not isinstance(value, str):
        return None
    try:
        return validate_email(value.strip(), check_deliverability=False).normalized.casefold()
    except EmailNotValidError:
        return None


def _current_participant():
    participant_id = get_jwt_identity()
    try:
        participant_uuid = UUID(participant_id)
    except (TypeError, ValueError):
        return None
    return db.session.get(Participant, participant_uuid)


def _require_current_participant():
    participant = _current_participant()
    if participant is None:
        return None, (jsonify({"message": "Participant account was not found."}), 401)
    return participant, None


def _proxy_laravel(method, path, *, payload=None):
    body, status = request_laravel(method, path, payload=payload)
    return jsonify(body), status


@api.post("/participants")
def register_participant():
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        return _validation_error({"body": ["A JSON object is required."]})

    errors = {}
    nom = payload.get("nom")
    email = _validated_email(payload.get("email"))
    password = payload.get("password")

    if not isinstance(nom, str) or not nom.strip() or len(nom.strip()) > 120:
        errors["nom"] = ["Name is required and must be at most 120 characters."]
    if email is None or len(email) > 255:
        errors["email"] = ["A valid email address of at most 255 characters is required."]
    if not isinstance(password, str) or len(password) < 12 or len(password) > 128:
        errors["password"] = ["Password must be between 12 and 128 characters."]
    if payload.get("password_confirmation") != password:
        errors["password_confirmation"] = ["Password confirmation does not match."]
    if errors:
        return _validation_error(errors)

    if db.session.query(Participant.id).filter_by(email=email).first():
        return jsonify({"message": "An account with this email already exists."}), 409

    participant = Participant(
        nom=nom.strip(),
        email=email,
        password_hash=generate_password_hash(password),
    )
    db.session.add(participant)
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"message": "An account with this email already exists."}), 409

    return jsonify(
        {
            "access_token": _participant_access_token(participant),
            "token_type": "Bearer",
            "participant": _participant_json(participant),
        }
    ), 201


@api.post("/auth/login")
def login():
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        return _validation_error({"body": ["A JSON object is required."]})

    email = _validated_email(payload.get("email"))
    password = payload.get("password")
    errors = {}
    if email is None:
        errors["email"] = ["A valid email address is required."]
    if not isinstance(password, str) or not password:
        errors["password"] = ["Password is required."]
    if errors:
        return _validation_error(errors)

    participant = db.session.query(Participant).filter_by(email=email).first()
    if not participant or not check_password_hash(participant.password_hash, password):
        return jsonify({"message": "The provided credentials are incorrect."}), 401

    return jsonify(
        {
            "access_token": _participant_access_token(participant),
            "token_type": "Bearer",
            "participant": _participant_json(participant),
        }
    )


@api.get("/participants/me")
@jwt_required()
def current_participant():
    participant, error = _require_current_participant()
    if error:
        return error
    return jsonify({"data": _participant_json(participant)})


@api.get("/inscriptions")
@jwt_required()
def list_participant_registrations():
    participant, error = _require_current_participant()
    if error:
        return error

    return _proxy_laravel(
        "GET",
        f"integration/participants/{participant.id}/inscriptions",
    )
