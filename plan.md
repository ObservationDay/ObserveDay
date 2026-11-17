# SmartConseil Full-Stack Exercise Plan

## Goal

Build a training-workshop management platform with three roles:

- **Admin:** manages workshops, assigns trainers, and views registrations.
- **Trainer:** views assigned workshops and their participants.
- **Participant:** creates an account, browses workshops, and registers.

The solution must demonstrate Angular, Laravel, Python, and real HTTP communication between the two backends.

## Proposed technology versions

| Area | Choice | Reason |
| --- | --- | --- |
| Front end | Angular **16.2.x**, TypeScript **5.1.x**, RxJS **7.8.x** | Angular 16 is one of the versions named in the exercise; its modules, routing, HTTP client, and Reactive Forms cover the required UI. |
| Front-end runtime | Node.js **18.20.x** / npm **10.x** | Compatible with Angular 16. **Legacy constraint:** Node 18 and Angular 16 are out of support; use them only if required by the exercise. If the evaluator permits a newer Angular version, upgrade before implementation. |
| Admin/trainer API | PHP **8.4.x**, Laravel **13.x**, Laravel Sanctum **4.x** | Laravel 13 requires PHP 8.3+, and provides the main REST API, Eloquent ORM, migrations, validation, and token authentication. |
| Participant API | Python **3.12.x**, Flask **3.1.x**, SQLAlchemy **2.0.x**, Requests **2.32.x** | Python 3.12 is already available in the development environment; a small Flask service fits the participant-focused API, SQLAlchemy persists participant accounts, and Requests calls Laravel over HTTP. |
| Database | PostgreSQL **17.x** | Relational constraints and transactions fit workshops and registrations; both services can use it through their ORM. |
| API format | REST over HTTP, JSON, versioned under `/api/v1` | Simple to demonstrate and document across Angular, Flask, and Laravel. |

Use the framework-compatible dependency ranges above, then commit the generated lock files (`package-lock.json`, `composer.lock`, and a Python lock file) so the resolved patch versions are reproducible. Confirm all versions against the course environment before setup, especially the legacy Angular/Node requirement.

## Architecture and data ownership

- **Laravel is authoritative** for workshops, trainers, and registrations. Its API serves the admin/trainer workflows and workshop catalog.
- **Flask owns participant account creation and credentials.** It issues signed participant JWTs and serves account, login, and registration-history requests; it does not read Laravel's database directly.
- Angular calls Laravel directly to browse workshops and submit registrations. Laravel verifies the participant JWT using a shared server-side signing secret and derives participant identity/profile from its signed claims.
- To make Laravel's trainer/admin participant lists possible without cross-service database joins, Laravel stores the participant's stable ID and required display details alongside the registration.
- PostgreSQL may host both services' data, but each service accesses only its own tables through its ORM. Use UUIDs for cross-service participant identity; never share credentials or database tables as an integration mechanism.
- Angular uses Laravel for admin/trainer screens, participant workshop browsing, and enrollment. It uses Flask for participant account creation, login, and registration history.

## Step-by-step implementation

1. **Confirm scope and model the data — 1 hour**
   - Draw the MCD and export it as a PDF or image.
   - Define `users/trainers`, `workshops`, `participants`, and `registrations`, their relationships, required fields, and constraints.
   - Agree the API contract and participant-ID handoff before implementing either service.
2. **Build the Laravel API — 2.5 hours**
   - Scaffold Laravel and configure PostgreSQL, Eloquent models, and migrations.
   - Implement authentication/role checks and validated endpoints for workshop CRUD, trainer assignments, workshop listings, participant synchronization, registration, and participant lists.
   - Add uniqueness and transaction safeguards so a participant cannot register twice for the same workshop.
3. **Build the Python participant API — 1.5 hours**
   - Scaffold Flask, configure its environment and participant persistence, and create account, login, and registration-history endpoints.
   - Issue participant JWTs with signed identity/profile claims for Laravel to verify; keep the signing secret in both backends' environment.
   - Keep credentials and Laravel service tokens server-side; never expose them in Angular.
4. **Build the Angular front end — 2.5 hours**
   - Scaffold the agreed Angular version and add role-oriented routing and modular components.
   - Implement Reactive Forms, client-side validation, and separate HTTP services for Laravel and Flask.
   - Call Laravel for the participant catalog/enrollment and Flask for account, login, and registration history.
5. **Verify, document, and deliver — 0.5 hour**
   - Exercise the critical flows end to end and run the focused backend/frontend checks.
   - Finish `README.md` with architecture, installation, technical-choice justification, and a Python ↔ Laravel request/response example.
   - Include migrations/schema files and the MCD export; verify a clean setup from the documented steps.
6. **Optional SonarQube bonus — +1 hour**
   - Analyze one application area, add its SonarQube configuration, fix at least two reported issues, and include a dashboard screenshot.

## Time and completion checks

The required work estimates total **8 hours** before breaks. The brief also requires a five-minute break every two hours and a 30–60 minute lunch, so reserve at least **8 hours 45 minutes** elapsed time (three short breaks plus a 30-minute lunch) for the full required scope. Do not count the optional SonarQube hour as part of the required deliverables.

The required scope is complete when:

- The MCD, three application parts, and database schema/migrations are present.
- Admin and trainer workflows use Laravel; participant account and registration workflows use Flask.
- A participant can browse workshops and enroll directly through Laravel using a Flask-issued participant JWT.
- Admin/trainer participant lists reflect those registrations.
- The README contains the required setup and architecture details, including a real API exchange example.
- The documented setup and focused tests work from a clean checkout.
