import unittest
from unittest.mock import Mock, patch
from uuid import UUID

from participant_api import create_app
from participant_api.extensions import db


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
            db.create_all()

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
        result = self.app.test_cli_runner().invoke(args=["init-db"])

        self.assertEqual(result.exit_code, 0, result.output)

    def test_participant_account_is_created_with_a_hashed_password_and_jwt(self):
        response = self.create_participant()

        self.assertEqual(response.status_code, 201)
        body = response.get_json()
        self.assertEqual(body["token_type"], "Bearer")
        self.assertEqual(body["participant"]["email"], "participant@example.com")
        self.assertIsInstance(UUID(body["participant"]["id"]), UUID)
        self.assertNotIn("password_hash", body["participant"])
        self.assertTrue(body["access_token"])

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

    def test_duplicate_email_is_rejected_case_insensitively(self):
        self.assertEqual(self.create_participant().status_code, 201)

        duplicate = self.create_participant(email="PARTICIPANT@example.com")

        self.assertEqual(duplicate.status_code, 409)

    @patch("participant_api.laravel_client.requests.request")
    def test_workshop_catalog_is_proxied_with_server_token(self, request_mock):
        upstream = Mock(status_code=200)
        upstream.json.return_value = {"data": [{"id": "workshop-id"}]}
        request_mock.return_value = upstream

        response = self.client.get("/api/v1/ateliers")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json(), {"data": [{"id": "workshop-id"}]})
        request_mock.assert_called_once_with(
            "GET",
            "http://laravel.test/api/v1/integration/ateliers",
            headers={
                "Accept": "application/json",
                "Authorization": "Bearer test-laravel-token",
            },
            json=None,
            timeout=(3, 10),
        )

    @patch("participant_api.laravel_client.requests.request")
    def test_registration_uses_authenticated_participant_and_forwards_capacity_error(
        self, request_mock
    ):
        created = self.create_participant()
        participant_id = created.get_json()["participant"]["id"]
        access_token = created.get_json()["access_token"]
        upstream = Mock(status_code=409)
        upstream.json.return_value = {"message": "This workshop has no available seats."}
        request_mock.return_value = upstream

        response = self.client.post(
            "/api/v1/inscriptions",
            headers={"Authorization": f"Bearer {access_token}"},
            json={
                "workshop_id": "62a09262-2cb3-4f15-a755-4f8e623a4451",
                "participant_id": "0f8bfaeb-18ba-4f26-b5ed-c1801d9e2474",
                "email": "forged@example.com",
            },
        )

        self.assertEqual(response.status_code, 409)
        self.assertEqual(
            request_mock.call_args.kwargs["json"],
            {
                "workshop_id": "62a09262-2cb3-4f15-a755-4f8e623a4451",
                "participant_id": participant_id,
                "nom_affiche": "Test Participant",
                "email": "participant@example.com",
            },
        )

    def test_registration_requires_participant_authentication(self):
        response = self.client.post(
            "/api/v1/inscriptions",
            json={"workshop_id": "62a09262-2cb3-4f15-a755-4f8e623a4451"},
        )

        self.assertEqual(response.status_code, 401)


if __name__ == "__main__":
    unittest.main()
