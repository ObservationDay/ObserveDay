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

        $otherWorkshop = $this->withToken($adminToken)
            ->postJson('/api/v1/ateliers', [
                'titre' => 'Other participant API test',
                'description' => 'Registration belongs to another participant.',
                'starts_at' => now()->addDay()->toIso8601String(),
                'ends_at' => now()->addDays(2)->toIso8601String(),
                'capacity' => 1,
                'status' => 'ouvert',
                'trainer_id' => null,
            ])
            ->assertCreated()
            ->json('data');

        $cancelledWorkshop = $this->withToken($adminToken)
            ->postJson('/api/v1/ateliers', [
                'titre' => 'Cancelled API integration test',
                'description' => 'This workshop must not appear in the public catalog.',
                'starts_at' => now()->addDay()->toIso8601String(),
                'ends_at' => now()->addDays(2)->toIso8601String(),
                'capacity' => 1,
                'status' => 'annule',
                'trainer_id' => null,
            ])
            ->assertCreated()
            ->json('data');

        $serviceTokenResponse = $this->withToken($adminToken)
            ->postJson('/api/v1/auth/python-token')
            ->assertCreated()
            ->assertJsonPath('abilities', [
                'catalog:read',
                'registrations:read',
                'registrations:write',
            ]);
        $serviceToken = $serviceTokenResponse->json('access_token');

        $this->withToken($serviceToken)
            ->postJson('/api/v1/ateliers', [])
            ->assertForbidden();

        $catalog = $this->withToken($serviceToken)
            ->getJson('/api/v1/integration/ateliers')
            ->assertOk()
            ->json('data');
        $catalogIds = array_column($catalog, 'id');
        $this->assertContains($workshop['id'], $catalogIds);
        $this->assertNotContains($cancelledWorkshop['id'], $catalogIds);

        $participantId = (string) Str::uuid();
        $otherParticipantId = (string) Str::uuid();
        $registrationData = [
            'workshop_id' => $workshop['id'],
            'participant_id' => $participantId,
            'nom_affiche' => 'API participant',
            'email' => Str::uuid().'@example.test',
        ];

        $this->withToken($serviceToken)
            ->postJson('/api/v1/integration/inscriptions', [
                'workshop_id' => $otherWorkshop['id'],
                'participant_id' => $otherParticipantId,
                'nom_affiche' => 'Other API participant',
                'email' => Str::uuid().'@example.test',
            ])
            ->assertCreated();

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

        $this->withToken($serviceToken)
            ->getJson('/api/v1/integration/participants/'.$participantId.'/inscriptions')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.participant.participant_id', $participantId);
    }
}
