# Participant API

Flask owns participant accounts in the PostgreSQL `participants.participants` table. Laravel remains the source of truth for workshops and registrations; Flask calls Laravel over HTTP using a restricted server-side bearer token. Participant passwords never leave Flask.

## Setup on Windows

From this folder, create a virtual environment, install dependencies, and configure local settings:

```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
Copy-Item .env.example .env
```

Edit `.env`:

- Set `DATABASE_URL` to the same PostgreSQL database used by Laravel. URL-encode special characters in the password.
- Generate a private signing key, for example with `python -c "import secrets; print(secrets.token_urlsafe(48))"`, and set it as `JWT_SECRET_KEY`.
- Create a Laravel integration token with an admin account using `POST /api/v1/auth/python-token`, then set the returned token as `LARAVEL_SERVICE_TOKEN`. Never expose this token to Angular or participants.

Initialize the Python-owned schema and table once:

```powershell
.\.venv\Scripts\python.exe -m flask --app app init-db
```

This creates the `participants` PostgreSQL schema and its ORM table if they do not already exist. It does not modify Laravel's `gestion` schema.

## Run and test

```powershell
.\.venv\Scripts\python.exe -m flask --app app run --debug
.\.venv\Scripts\python.exe -m unittest discover -s tests
```

The health endpoint is `http://127.0.0.1:5000/`.

## API

All endpoints return JSON under `/api/v1`:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/participants` | Create participant account; returns a participant JWT |
| `POST` | `/auth/login` | Authenticate and obtain a participant JWT |
| `GET` | `/participants/me` | Return the authenticated participant |
| `GET` | `/ateliers` | Proxy Laravel's available workshop catalog |
| `GET` | `/ateliers/{workshop_id}` | Proxy one available Laravel workshop |
| `POST` | `/inscriptions` | Register the authenticated participant through Laravel |

Account creation accepts `nom`, `email`, `password`, and `password_confirmation`. Workshop registration accepts only `workshop_id`; Flask supplies the participant UUID and profile fields from the authenticated account, so clients cannot register another participant. Laravel enforces workshop capacity and duplicate-registration rules.

Example registration request:

```http
POST /api/v1/inscriptions
Authorization: Bearer <participant-access-token>
Content-Type: application/json

{"workshop_id":"<workshop-uuid>"}
```

Participant access tokens expire after 30 minutes. Laravel's integration token remains server-side in `.env`; do not commit `.env` or expose its contents.
