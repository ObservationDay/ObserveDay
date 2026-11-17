# SmartconseilFrontend

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 16.2.16.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Participant interface

The public participant area is available at `/participant/ateliers`; the root URL redirects there. Participants can create an account, sign in, browse open workshops, and register for an available workshop. Angular sends participant requests to the Flask API at `http://127.0.0.1:5000/api/v1`. Flask securely calls Laravel for the workshop catalog and registration, so the Laravel service token stays on the server.

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
