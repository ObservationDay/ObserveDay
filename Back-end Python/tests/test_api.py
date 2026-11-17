import unittest
from unittest.mock import Mock, patch
from uuid import UUID

from flask_jwt_extended import decode_token
from flask_migrate import upgrade
from sqlalchemy import text

from participant_api import create_app
from participant_api.extensions import db
from participant_api.models import Participant


class ParticipantApiTests(unittest.TestCase):
    def setUp(self):
        self.app = create_app(
            {
                "TESTING": True,
                "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",
                "JWT_SECRET_KEY": "test-signing-key-with-at-least-thirty-two-characters",
                "LARAVEL_API_URL": "http://laravel.test/api/v1",
                "LARAVEL_SERVICE_TOKEN": "test-laravel-token",
                "CORS_ORIGINS": ["http://localhost:4200"],
            }
        )
        self.client = self.app.test_client()
        with self.app.app_context():
            upgrade()

    def tearDown(self):
        with self.app.app_context():
            db.session.remove()
            db.drop_all()
            db.engine.dispose()

    def create_participant(self, email="participant@example.com"):
        return self.client.post(
            "/api/v1/participants",
            json={
                "nom": "Test Participant",
                "email": email,
                "password": "correct-horse-battery",
                "password_confirmation": "correct-horse-battery",
            },
        )

    def test_health_endpoint_keeps_existing_response(self):
        response = self.client.get("/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.get_json(),
            {"message": "SmartConseil participant API"},
        )

    def test_database_initialization_command_is_idempotent(self):
        runner = self.app.test_cli_runner()

        first_result = runner.invoke(args=["init-db"])
        second_result = runner.invoke(args=["init-db"])
        check_result = runner.invoke(args=["db", "check"])

        self.assertEqual(first_result.exit_code, 0, first_result.output)
        self.assertEqual(second_result.exit_code, 0, second_result.output)
        self.assertEqual(check_result.exit_code, 0, check_result.output)

    def test_existing_participant_data_survives_migration_baseline_stamp(self):
        response = self.create_participant()
        participant_id = UUID(response.get_json()["participant"]["id"])

        with self.app.app_context():
            db.session.execute(text("DROP TABLE alembic_version"))
            db.session.commit()

        result = self.app.test_cli_runner().invoke(args=["db", "stamp", "head"])

        self.assertEqual(result.exit_code, 0, result.output)
        with self.app.app_context():
            self.assertIsNotNone(db.session.get(Participant, participant_id))

    def test_participant_account_is_created_with_a_hashed_password_and_jwt(self):
        response = self.create_participant()

        self.assertEqual(response.status_code, 201)
        body = response.get_json()
        self.assertEqual(body["token_type"], "Bearer")
        self.assertEqual(body["participant"]["email"], "participant@example.com")
        self.assertIsInstance(UUID(body["participant"]["id"]), UUID)
        self.assertNotIn("password_hash", body["participant"])
        self.assertTrue(body["access_token"])
        with self.app.app_context():
            claims = decode_token(body["access_token"])
        self.assertEqual(claims["participant_name"], "Test Participant")
        self.assertEqual(claims["participant_email"], "participant@example.com")

        login = self.client.post(
            "/api/v1/auth/login",
            json={
                "email": "PARTICIPANT@example.com",
                "password": "correct-horse-battery",
            },
        )
        self.assertEqual(login.status_code, 200)

        profile = self.client.get(
            "/api/v1/participants/me",
            headers={"Authorization": f"Bearer {login.get_json()['access_token']}"},
        )
        self.assertEqual(profile.status_code, 200)
        self.assertEqual(profile.get_json()["data"]["email"], "participant@example.com")

    def test_participant_jwt_is_not_accepted_from_cookies(self):
        created = self.create_participant()
        token = created.get_json()["access_token"]

        response = self.client.get(
            "/api/v1/participants/me",
            headers={"Cookie": f"access_token_cookie={token}"},
        )

        self.assertEqual(response.status_code, 401)

    def test_duplicate_email_is_rejected_case_insensitively(self):
        self.assertEqual(self.create_participant().status_code, 201)

        duplicate = self.create_participant(email="PARTICIPANT@example.com")

        self.assertEqual(duplicate.status_code, 409)

    def test_workshop_catalog_and_enrollment_are_not_exposed_by_python(self):
        catalog = self.client.get("/api/v1/ateliers")
        registration = self.client.post(
            "/api/v1/inscriptions",
            json={"workshop_id": "62a09262-2cb3-4f15-a755-4f8e623a4451"},
        )

        self.assertEqual(catalog.status_code, 404)
        self.assertEqual(registration.status_code, 405)

    @patch("participant_api.laravel_client.requests.request")
    def test_participant_can_list_only_their_laravel_registrations(self, request_mock):
        created = self.create_participant()
        participant_id = created.get_json()["participant"]["id"]
        access_token = created.get_json()["access_token"]
        upstream = Mock(status_code=200)
        upstream.json.return_value = {"data": [], "meta": {"total": 0}}
        request_mock.return_value = upstream

        response = self.client.get(
            "/api/v1/inscriptions",
            headers={"Authorization": f"Bearer {access_token}"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json(), {"data": [], "meta": {"total": 0}})
        request_mock.assert_called_once_with(
            "GET",
            f"http://laravel.test/api/v1/integration/participants/{participant_id}/inscriptions",
            headers={
                "Accept": "application/json",
                "Authorization": "Bearer test-laravel-token",
            },
            json=None,
            timeout=(3, 10),
        )

    def test_participant_registration_list_requires_authentication(self):
        response = self.client.get("/api/v1/inscriptions")

        self.assertEqual(response.status_code, 401)


if __name__ == "__main__":
    unittest.main()
