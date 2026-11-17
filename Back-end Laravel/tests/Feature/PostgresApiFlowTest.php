<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Str;
use Tests\TestCase;

class PostgresApiFlowTest extends TestCase
{
    use DatabaseTransactions;

    public function test_participant_can_read_catalog_and_register_directly_with_flask_jwt(): void
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
                'titre' => 'Direct participant API test',
                'description' => 'Catalog and registration use Laravel directly.',
                'starts_at' => now()->addDay()->toIso8601String(),
                'ends_at' => now()->addDays(2)->toIso8601String(),
                'capacity' => 1,
                'status' => 'ouvert',
                'trainer_id' => null,
            ])
            ->assertCreated()
            ->json('data');

        $this->withHeaders(['Authorization' => ''])
            ->getJson('/api/v1/participant/ateliers')
            ->assertOk()
            ->assertJsonPath('data.0.id', $workshop['id']);

        $secret = 'test-participant-jwt-secret-with-at-least-thirty-two-characters';
        config(['services.participant_jwt.secret' => $secret]);
        $participantId = (string) Str::uuid();
        $participantName = 'Direct API participant';
        $participantEmail = 'direct-participant@example.test';
        $participantToken = $this->participantJwt(
            $participantId,
            $participantName,
            $participantEmail,
            $secret,
        );
        $registrationPayload = ['workshop_id' => $workshop['id']];

        $this->withHeaders(['Authorization' => ''])
            ->postJson('/api/v1/participant/inscriptions', $registrationPayload)
            ->assertUnauthorized();
        $this->withToken($participantToken.'x')
            ->postJson('/api/v1/participant/inscriptions', $registrationPayload)
            ->assertUnauthorized();

        $registration = $this->withToken($participantToken)
            ->postJson('/api/v1/participant/inscriptions', [
                ...$registrationPayload,
                'participant_id' => (string) Str::uuid(),
                'nom_affiche' => 'Forged name',
                'email' => 'forged@example.test',
            ])
            ->assertCreated()
            ->assertJsonPath('data.participant.participant_id', $participantId)
            ->assertJsonPath('data.participant.nom_affiche', $participantName)
            ->assertJsonPath('data.participant.email', $participantEmail)
            ->json('data');

        $this->withToken($participantToken)
            ->postJson('/api/v1/participant/inscriptions', $registrationPayload)
            ->assertOk()
            ->assertJsonPath('data.id', $registration['id']);

        $otherParticipantToken = $this->participantJwt(
            (string) Str::uuid(),
            'Other participant',
            'other-participant@example.test',
            $secret,
        );
        $this->withToken($otherParticipantToken)
            ->postJson('/api/v1/participant/inscriptions', $registrationPayload)
            ->assertStatus(409);

        $serviceToken = $this->withToken($adminToken)
            ->postJson('/api/v1/auth/python-token')
            ->assertCreated()
            ->assertJsonPath('abilities', ['registrations:read'])
            ->json('access_token');

        $this->withToken($serviceToken)
            ->getJson('/api/v1/integration/participants/'.$participantId.'/inscriptions')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.participant.participant_id', $participantId);
    }

    private function participantJwt(
        string $participantId,
        string $name,
        string $email,
        string $secret,
    ): string {
        $encode = static fn (array $value): string => rtrim(strtr(
            base64_encode(json_encode($value, JSON_THROW_ON_ERROR)),
            '+/',
            '-_',
        ), '=');

        $header = $encode(['alg' => 'HS256', 'typ' => 'JWT']);
        $claims = $encode([
            'sub' => $participantId,
            'type' => 'access',
            'iat' => time(),
            'exp' => time() + 1800,
            'participant_name' => $name,
            'participant_email' => $email,
        ]);
        $input = "{$header}.{$claims}";
        $signature = rtrim(strtr(
            base64_encode(hash_hmac('sha256', $input, $secret, true)),
            '+/',
            '-_',
        ), '=');

        return "{$input}.{$signature}";
    }
}
