<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\FormateurController;
use App\Http\Controllers\Api\V1\IntegrationController;
use App\Http\Controllers\Api\V1\ParticipantRefController;
use App\Http\Controllers\Api\V1\RegistrationController;
use App\Http\Controllers\Api\V1\WorkshopController;
use App\Http\Resources\UserResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return new UserResource($request->user());
})->middleware('auth:sanctum');

Route::prefix('v1')->group(function (): void {
    Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:10,1');

    Route::middleware('auth:sanctum')->group(function (): void {
        Route::get('/auth/me', [AuthController::class, 'me']);
        Route::delete('/auth/logout', [AuthController::class, 'logout']);

        Route::middleware('role:admin')->group(function (): void {
            Route::post('/auth/python-token', [AuthController::class, 'createPythonServiceToken']);
            Route::apiResource('formateurs', FormateurController::class)->except(['create', 'edit']);
            Route::post('/ateliers', [WorkshopController::class, 'store']);
            Route::match(['put', 'patch'], '/ateliers/{workshop}', [WorkshopController::class, 'update']);
            Route::delete('/ateliers/{workshop}', [WorkshopController::class, 'destroy']);
        });

        Route::middleware('role:admin,formateur')->group(function (): void {
            Route::get('/ateliers', [WorkshopController::class, 'index']);
            Route::get('/ateliers/{workshop}', [WorkshopController::class, 'show']);
            Route::get('/inscriptions', [RegistrationController::class, 'index']);
            Route::get('/inscriptions/{registration}', [RegistrationController::class, 'show']);
            Route::patch('/inscriptions/{registration}/annulation', [RegistrationController::class, 'cancel']);
            Route::get('/participants', [ParticipantRefController::class, 'index']);
            Route::get('/participants/{participantRef}', [ParticipantRefController::class, 'show']);
        });

        Route::prefix('integration')
            ->middleware('abilities:catalog:read')
            ->group(function (): void {
                Route::get('/ateliers', [IntegrationController::class, 'workshops']);
                Route::get('/ateliers/{workshop}', [IntegrationController::class, 'workshop']);
            });

        Route::prefix('integration')
            ->middleware('abilities:registrations:read')
            ->group(function (): void {
                Route::get(
                    '/participants/{participantId}/inscriptions',
                    [IntegrationController::class, 'participantRegistrations'],
                )->whereUuid('participantId');
            });

        Route::prefix('integration')
            ->middleware('abilities:registrations:write')
            ->group(function (): void {
                Route::post('/inscriptions', [IntegrationController::class, 'register']);
                Route::patch('/inscriptions/{registration}/annulation', [IntegrationController::class, 'cancelRegistration']);
            });
    });
});
