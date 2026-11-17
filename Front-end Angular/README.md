# SmartconseilFrontend

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 16.2.16.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Participant interface

The public participant area is available at `/participant/ateliers`; the root URL redirects there. Participants create accounts and sign in through Flask at `http://127.0.0.1:5000/api/v1`. Angular calls Laravel directly for the workshop catalog and enrollment at `http://127.0.0.1:8000/api/v1`; Laravel verifies the participant JWT using the shared server-side secret. Flask continues to provide the participant's registration history through a restricted server token that is never exposed to Angular.

For the full flow, start Laravel and Flask in separate terminals before starting Angular:

```powershell
# Laravel
cd "Back-end Laravel"
php artisan serve

# Flask
cd "Back-end Python"
.\.venv\Scripts\python.exe -m flask --app app run --debug

# Angular
cd "Front-end Angular"
npm start
```

The staff interface remains available at `/login`.

## End-to-end participant test

The Playwright test creates a participant and registration, then checks that an admin can see the registration. It writes persistent records, so point both Laravel and Flask at a **disposable PostgreSQL test database** with migrations initialized, an admin account, and at least one open workshop with available seats. Do not run it against your normal development or production database. The `E2E_TEST_DATABASE` flag is an acknowledgement only; it cannot verify which database the APIs use.

Create a separate database, set Laravel's `DB_DATABASE` and Python's `DATABASE_URL` to it, then run Laravel migrations and Python's `init-db`. Set Laravel's `PARTICIPANT_JWT_SECRET` to the same value as Python's `JWT_SECRET_KEY`. Create a test admin, issue a Python service token with `registrations:read` from that Laravel database, configure it in Python's `.env`, and create an open workshop with available seats. Start Laravel and Flask against this test database. Test records remain in that database after the run; recreate or clear only the disposable test database before another clean run.

Create a local settings file (it is ignored by Git) and fill in the test admin credentials:

```powershell
if (-not (Test-Path .env.e2e.local)) {
  Copy-Item .env.e2e.local.example .env.e2e.local
}
```

Set `E2E_TEST_DATABASE=true` in `.env.e2e.local` only after confirming both APIs use the disposable database. From this folder, run:

```powershell
npm run test:e2e
```

The test uses Brave from its default Windows installation path when available. Set `PLAYWRIGHT_EXECUTABLE_PATH` if Brave is installed elsewhere. Playwright starts Angular automatically; Laravel and Flask must already be running on ports 8000 and 5000.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.
