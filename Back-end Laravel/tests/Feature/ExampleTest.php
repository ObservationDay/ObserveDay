<?php

namespace Tests\Feature;

use App\Models\PersonalAccessToken;
use App\Models\User;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    /**
     * A basic test example.
     */
    public function test_the_application_returns_a_successful_response(): void
    {
        $response = $this->get('/');

        $response->assertStatus(200);
    }

    public function test_unauthenticated_api_requests_return_json_instead_of_redirecting_to_login(): void
    {
        $this->get('/api/user', ['Accept' => 'text/html'])
            ->assertUnauthorized()
            ->assertJson(['message' => 'Unauthenticated.']);
    }

    public function test_trainer_cannot_create_workshops(): void
    {
        $trainer = new User([
            'nom' => 'Test Trainer',
            'email' => 'trainer@example.test',
            'password_hash' => 'a-strong-test-password',
            'role' => 'formateur',
        ]);
        $trainer->id = (string) Str::uuid();
        Sanctum::actingAs($trainer);

        $this->postJson('/api/v1/ateliers', [])
            ->assertForbidden();
    }

    public function test_python_integration_token_cannot_use_staff_endpoints(): void
    {
        $admin = new User([
            'nom' => 'Test Admin',
            'email' => 'admin@example.test',
            'password_hash' => 'a-strong-test-password',
            'role' => 'admin',
        ]);
        $admin->id = (string) Str::uuid();
        Sanctum::actingAs($admin, ['registrations:read']);
        $admin->withAccessToken(new PersonalAccessToken([
            'abilities' => ['registrations:read'],
        ]));

        $this->postJson('/api/v1/ateliers', [])
            ->assertForbidden();

        $this->getJson('/api/v1/participants')
            ->assertForbidden();
    }
}
