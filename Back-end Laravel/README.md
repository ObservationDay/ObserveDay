<p align="center"><a href="https://laravel.com" target="_blank"><img src="https://raw.githubusercontent.com/laravel/art/master/logo-lockup/5%20SVG/2%20CMYK/1%20Full%20Color/laravel-logolockup-cmyk-red.svg" width="400" alt="Laravel Logo"></a></p>

<p align="center">
<a href="https://github.com/laravel/framework/actions"><img src="https://github.com/laravel/framework/workflows/tests/badge.svg" alt="Build Status"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/dt/laravel/framework" alt="Total Downloads"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/v/laravel/framework" alt="Latest Stable Version"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/l/laravel/framework" alt="License"></a>
</p>

## Local setup

Create a PostgreSQL role and database in pgAdmin using the Query Tool. Run each command separately, replacing the example password with one of your choice:

```sql
CREATE ROLE smartconseil_app WITH LOGIN PASSWORD 'choose-a-local-password';
CREATE DATABASE smartconseil OWNER smartconseil_app;
```

Set that password as `DB_PASSWORD` in `.env`, then run:

```powershell
php artisan config:clear
php artisan migrate
php artisan serve
```

The Laravel domain tables are created in PostgreSQL schema `gestion`. Existing Laravel framework tables in `public` are left untouched. Run `php artisan migrate:status` to check applied migrations.

## API

The versioned API uses JSON under `/api/v1`. Create the first admin interactively with `php artisan app:create-admin`, then sign in at `POST /api/v1/auth/login` with `email` and `password`. Use the returned bearer token for the protected endpoints.

- Admin: manage `/formateurs` and create, update, or delete `/ateliers`.
- Admin and trainers: list workshops, registrations, and participant references. Trainers only see their assigned workshops and related participants.
- Python service: an admin can issue a limited token at `POST /api/v1/auth/python-token`. Use it for `GET /integration/ateliers`, `POST /integration/inscriptions`, and registration cancellation. The token must be kept server-side.

Workshop registrations are transactional, capacity-checked, and unique per workshop/participant. Cancellation changes the status to `annule` and retains history.

### Example: create and register for a workshop

Run this in PowerShell after creating an admin and starting the Laravel server. Replace the email and password placeholders. The admin token is for staff endpoints; the separate Python token has only catalog and registration abilities.

```powershell
$baseUrl = 'http://127.0.0.1:8000/api/v1'

$login = Invoke-RestMethod -Method Post -Uri "$baseUrl/auth/login" `
    -ContentType 'application/json' `
    -Body (@{ email = 'admin@example.test'; password = '<admin-password>' } | ConvertTo-Json)
$adminHeaders = @{ Authorization = "Bearer $($login.access_token)"; Accept = 'application/json' }

$startsAt = (Get-Date).AddDays(1)
$workshop = Invoke-RestMethod -Method Post -Uri "$baseUrl/ateliers" `
    -Headers $adminHeaders -ContentType 'application/json' `
    -Body (@{
        titre = 'API test workshop'
        description = 'Created through the Laravel API.'
        starts_at = $startsAt.ToString('o')
        ends_at = $startsAt.AddHours(2).ToString('o')
        capacity = 10
        status = 'ouvert'
        trainer_id = $null
    } | ConvertTo-Json)

$serviceToken = Invoke-RestMethod -Method Post -Uri "$baseUrl/auth/python-token" `
    -Headers $adminHeaders
$serviceHeaders = @{ Authorization = "Bearer $($serviceToken.access_token)"; Accept = 'application/json' }

$participantId = [guid]::NewGuid().ToString()
$registration = Invoke-RestMethod -Method Post -Uri "$baseUrl/integration/inscriptions" `
    -Headers $serviceHeaders -ContentType 'application/json' `
    -Body (@{
        workshop_id = $workshop.data.id
        participant_id = $participantId
        nom_affiche = 'API test participant'
        email = 'participant@example.test'
    } | ConvertTo-Json)

$registration.data
```

Resources use a top-level `data` object (or `data` array for collections). Login and token-creation responses return `access_token` at the top level. Keep both tokens private; do not commit them or place them in browser code.

## About Laravel

Laravel is a web application framework with expressive, elegant syntax. We believe development must be an enjoyable and creative experience to be truly fulfilling. Laravel takes the pain out of development by easing common tasks used in many web projects, such as:

- [Simple, fast routing engine](https://laravel.com/docs/routing).
- [Powerful dependency injection container](https://laravel.com/docs/container).
- Multiple back-ends for [session](https://laravel.com/docs/session) and [cache](https://laravel.com/docs/cache) storage.
- Expressive, intuitive [database ORM](https://laravel.com/docs/eloquent).
- Database agnostic [schema migrations](https://laravel.com/docs/migrations).
- [Robust background job processing](https://laravel.com/docs/queues).
- [Real-time event broadcasting](https://laravel.com/docs/broadcasting).

Laravel is accessible, powerful, and provides tools required for large, robust applications.

## Learning Laravel

Laravel has the most extensive and thorough [documentation](https://laravel.com/docs) and video tutorial library of all modern web application frameworks, making it a breeze to get started with the framework.

In addition, [Laracasts](https://laracasts.com) contains thousands of video tutorials on a range of topics including Laravel, modern PHP, unit testing, and JavaScript. Boost your skills by digging into our comprehensive video library.

You can also watch bite-sized lessons with real-world projects on [Laravel Learn](https://laravel.com/learn), where you will be guided through building a Laravel application from scratch while learning PHP fundamentals.

## Agentic Development

Laravel's predictable structure and conventions make it ideal for AI coding agents like Claude Code, Cursor, and GitHub Copilot. Install [Laravel Boost](https://laravel.com/docs/ai) to supercharge your AI workflow:

```bash
composer require laravel/boost --dev

php artisan boost:install
```

Boost provides your agent 15+ tools and skills that help agents build Laravel applications while following best practices.

## Contributing

Thank you for considering contributing to the Laravel framework! The contribution guide can be found in the [Laravel documentation](https://laravel.com/docs/contributions).

## Code of Conduct

In order to ensure that the Laravel community is welcoming to all, please review and abide by the [Code of Conduct](https://laravel.com/docs/contributions#code-of-conduct).

## Security Vulnerabilities

If you discover a security vulnerability within Laravel, please send an e-mail to Taylor Otwell via [taylor@laravel.com](mailto:taylor@laravel.com). All security vulnerabilities will be promptly addressed.

## License

The Laravel framework is open-sourced software licensed under the [MIT license](https://opensource.org/licenses/MIT).
