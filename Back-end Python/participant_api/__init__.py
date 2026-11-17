import os
from datetime import timedelta

from flask import Flask, jsonify
from flask_cors import CORS
from flask_migrate import upgrade
from sqlalchemy import event

from .extensions import db, jwt, migrate


def create_app(test_config=None):
    app = Flask(__name__)
    app.config.from_mapping(
        SQLALCHEMY_DATABASE_URI=os.getenv("DATABASE_URL"),
        SQLALCHEMY_ENGINE_OPTIONS={"pool_pre_ping": True},
        JWT_SECRET_KEY=os.getenv("JWT_SECRET_KEY"),
        JWT_ACCESS_TOKEN_EXPIRES=timedelta(minutes=30),
        LARAVEL_API_URL=os.getenv(
            "LARAVEL_API_URL", "http://127.0.0.1:8000/api/v1"
        ),
        LARAVEL_SERVICE_TOKEN=os.getenv("LARAVEL_SERVICE_TOKEN", ""),
        CORS_ORIGINS=os.getenv(
            "CORS_ORIGINS",
            "http://localhost:4200,http://127.0.0.1:4200",
        ),
    )
    if test_config:
        app.config.update(test_config)

    if not app.config["SQLALCHEMY_DATABASE_URI"]:
        raise RuntimeError("DATABASE_URL must be set before starting the API.")
    jwt_secret = app.config["JWT_SECRET_KEY"]
    if not jwt_secret or len(jwt_secret) < 32:
        raise RuntimeError("JWT_SECRET_KEY must contain at least 32 characters.")

    db.init_app(app)
    jwt.init_app(app)
    migrate.init_app(
        app,
        db,
        directory=os.path.join(os.path.dirname(__file__), "..", "migrations"),
        compare_type=True,
    )

    with app.app_context():
        if db.engine.dialect.name == "sqlite":
            @event.listens_for(db.engine, "connect")
            def attach_participants_schema(connection, _record):
                cursor = connection.cursor()
                cursor.execute("ATTACH DATABASE ':memory:' AS participants")
                cursor.close()

    origins = app.config["CORS_ORIGINS"]
    if isinstance(origins, str):
        origins = [origin.strip() for origin in origins.split(",") if origin.strip()]
    CORS(app, resources={r"/api/*": {"origins": origins}})

    from .api import api

    app.register_blueprint(api)

    @app.get("/")
    def health():
        return jsonify({"message": "SmartConseil participant API"})

    @jwt.unauthorized_loader
    def missing_token(message):
        return jsonify({"message": message}), 401

    @jwt.invalid_token_loader
    def invalid_token(message):
        return jsonify({"message": message}), 401

    @jwt.expired_token_loader
    def expired_token(_jwt_header, _jwt_payload):
        return jsonify({"message": "The access token has expired."}), 401

    @app.cli.command("init-db")
    def init_db():
        upgrade()
        print("Participant database schema is ready.")

    return app
