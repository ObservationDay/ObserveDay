<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Workshop;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class WorkshopScheduleValidationTest extends TestCase
{
    use DatabaseTransactions;

    public function test_workshops_cannot_overlap_for_the_same_trainer(): void
    {
        if (config('database.default') !== 'pgsql') {
            $this->markTestSkipped('This integration test requires PostgreSQL.');
        }

        $admin = User::factory()->create(['role' => 'admin']);
        $trainer = User::factory()->create(['role' => 'formateur']);
        $otherTrainer = User::factory()->create(['role' => 'formateur']);
        $adminToken = $this->postJson('/api/v1/auth/login', [
            'email' => $admin->email,
            'password' => 'password',
        ])->assertOk()->json('access_token');

        $startsAt = now()->addDays(5)->startOfDay()->addHours(9);
        $endsAt = (clone $startsAt)->addHour();

        $existingWorkshop = $this->createWorkshop(
            $adminToken,
            $trainer,
            $startsAt,
            $endsAt,
            'Existing workshop',
        );
        $this->assertTrue(Workshop::query()
            ->overlappingSchedule(
                $trainer->id,
                (clone $startsAt)->addMinutes(30)->format(DATE_ATOM),
                (clone $endsAt)->addMinutes(30)->format(DATE_ATOM),
            )
            ->exists());

        $this->withToken($adminToken)
            ->postJson('/api/v1/ateliers', $this->workshopPayload(
                $trainer,
                (clone $startsAt)->addMinutes(30),
                (clone $endsAt)->addMinutes(30),
                'Overlapping workshop',
            ))
            ->assertUnprocessable()
            ->assertJsonPath(
                'errors.trainer_id.0',
                'The trainer already has a workshop scheduled during this time.',
            );

        $adjacentWorkshop = $this->createWorkshop(
            $adminToken,
            $trainer,
            $endsAt,
            (clone $endsAt)->addHour(),
            'Adjacent workshop',
        );

        $this->createWorkshop(
            $adminToken,
            $otherTrainer,
            $startsAt,
            $endsAt,
            'Other trainer workshop',
        );

        $cancelledStart = (clone $endsAt)->addHours(2);
        $cancelledEnd = (clone $cancelledStart)->addHour();
        $this->createWorkshop(
            $adminToken,
            $trainer,
            $cancelledStart,
            $cancelledEnd,
            'Cancelled workshop',
            'annule',
        );

        $this->createWorkshop(
            $adminToken,
            $trainer,
            (clone $cancelledStart)->addMinutes(30),
            (clone $cancelledEnd)->addMinutes(30),
            'Workshop after cancellation',
        );

        $this->withToken($adminToken)
            ->patchJson('/api/v1/ateliers/'.$existingWorkshop['id'], [
                'starts_at' => $startsAt->toIso8601String(),
                'ends_at' => $endsAt->toIso8601String(),
                'trainer_id' => $trainer->id,
            ])
            ->assertOk();

        $this->withToken($adminToken)
            ->patchJson('/api/v1/ateliers/'.$adjacentWorkshop['id'], [
                'starts_at' => (clone $startsAt)->addMinutes(30)->toIso8601String(),
                'ends_at' => (clone $endsAt)->addMinutes(30)->toIso8601String(),
            ])
            ->assertUnprocessable()
            ->assertJsonPath(
                'errors.trainer_id.0',
                'The trainer already has a workshop scheduled during this time.',
            );
    }

    private function createWorkshop(
        string $adminToken,
        User $trainer,
        \DateTimeInterface $startsAt,
        \DateTimeInterface $endsAt,
        string $title,
        string $status = 'ouvert',
    ): array {
        return $this->withToken($adminToken)
            ->postJson('/api/v1/ateliers', $this->workshopPayload(
                $trainer,
                $startsAt,
                $endsAt,
                $title,
                $status,
            ))
            ->assertCreated()
            ->json('data');
    }

    private function workshopPayload(
        User $trainer,
        \DateTimeInterface $startsAt,
        \DateTimeInterface $endsAt,
        string $title,
        string $status = 'ouvert',
    ): array {
        return [
            'titre' => $title,
            'description' => 'Schedule validation test workshop.',
            'starts_at' => $startsAt->format(DATE_ATOM),
            'ends_at' => $endsAt->format(DATE_ATOM),
            'capacity' => 10,
            'status' => $status,
            'trainer_id' => $trainer->id,
        ];
    }
}
