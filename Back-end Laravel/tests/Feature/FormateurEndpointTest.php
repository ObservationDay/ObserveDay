<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class FormateurEndpointTest extends TestCase
{
    use DatabaseTransactions;

    public function test_admin_can_create_a_formateur_with_created_status(): void
    {
        $this->requirePostgres();

        $response = $this->withToken($this->adminToken())
            ->postJson('/api/v1/formateurs', [
                'nom' => 'Test Formateur',
                'email' => 'formateur-endpoint@example.test',
                'password' => 'test-password-2026',
                'password_confirmation' => 'test-password-2026',
            ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.role', 'formateur');
    }

    public function test_admin_can_retrieve_a_formateur_with_success_status(): void
    {
        $this->requirePostgres();

        $formateur = User::factory()->create(['role' => 'formateur']);

        $this->withToken($this->adminToken())
            ->getJson('/api/v1/formateurs/'.$formateur->id)
            ->assertOk()
            ->assertJsonPath('data.id', $formateur->id);
    }

    private function adminToken(): string
    {
        $admin = User::factory()->create(['role' => 'admin']);

        return $this->postJson('/api/v1/auth/login', [
            'email' => $admin->email,
            'password' => 'password',
        ])->assertOk()->json('access_token');
    }

    private function requirePostgres(): void
    {
        if (config('database.default') !== 'pgsql') {
            $this->markTestSkipped('This integration test requires PostgreSQL.');
        }
    }
}
