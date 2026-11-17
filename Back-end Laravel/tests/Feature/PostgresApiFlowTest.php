<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Str;
use Tests\TestCase;

class PostgresApiFlowTest extends TestCase
{
    use DatabaseTransactions;

    public function test_admin_and_python_service_can_manage_a_workshop_registration(): void
    {
        if (config('database.default') !== 'pgsql') {
            $this->markTestSkipped('This integration test requires PostgreSQL.');
        }

        $admin = User::factory()->create(['role' => 'admin']);
        $adminToken = $this->postJson('/api/v1/auth/login', [
            'email' => $admin->email,
            'password' => 'password',
        ])->assertOk()->json('access_token');

        $workshop = $this->withToken($adminToken)
            ->postJson('/api/v1/ateliers', [
                'titre' => 'API integration test',
                'description' => 'Temporary PostgreSQL test record.',
                'starts_at' => now()->addDay()->toIso8601String(),
                'ends_at' => now()->addDays(2)->toIso8601String(),
                'capacity' => 1,
                'status' => 'ouvert',
                'trainer_id' => null,
            ])
            ->assertCreated()
            ->json('data');

        $serviceToken = $this->withToken($adminToken)
            ->postJson('/api/v1/auth/python-token')
            ->assertCreated()
            ->json('access_token');

        $this->withToken($serviceToken)
            ->postJson('/api/v1/ateliers', [])
            ->assertForbidden();

        $this->withToken($serviceToken)
            ->getJson('/api/v1/integration/ateliers')
            ->assertOk()
            ->assertJsonPath('data.0.id', $workshop['id']);

        $participantId = (string) Str::uuid();
        $registrationData = [
            'workshop_id' => $workshop['id'],
            'participant_id' => $participantId,
            'nom_affiche' => 'API participant',
            'email' => Str::uuid().'@example.test',
        ];

        $registration = $this->withToken($serviceToken)
            ->postJson('/api/v1/integration/inscriptions', $registrationData)
            ->assertCreated()
            ->assertJsonPath('data.participant.participant_id', $participantId)
            ->json('data');

        $this->withToken($serviceToken)
            ->postJson('/api/v1/integration/inscriptions', $registrationData)
            ->assertOk()
            ->assertJsonPath('data.id', $registration['id']);

        $this->withToken($serviceToken)
            ->postJson('/api/v1/integration/inscriptions', [
                ...$registrationData,
                'participant_id' => (string) Str::uuid(),
            ])
            ->assertStatus(409);

        $this->withToken($serviceToken)
            ->patchJson('/api/v1/integration/inscriptions/'.$registration['id'].'/annulation')
            ->assertOk()
            ->assertJsonPath('data.status', 'annule');

        $this->withToken($serviceToken)
            ->postJson('/api/v1/integration/inscriptions', $registrationData)
            ->assertOk()
            ->assertJsonPath('data.status', 'inscrit');
    }
}
