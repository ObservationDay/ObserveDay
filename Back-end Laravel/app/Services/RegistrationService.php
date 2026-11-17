<?php

namespace App\Services;

use App\Models\ParticipantRef;
use App\Models\Registration;
use App\Models\Workshop;
use Illuminate\Support\Facades\DB;

class RegistrationService
{
    /**
     * @param  array{workshop_id: string, participant_id: string, nom_affiche: string, email: string}  $data
     * @return array{registration: Registration, created: bool}
     */
    public function registerParticipant(array $data): array
    {
        return DB::transaction(function () use ($data): array {
            $workshop = Workshop::query()
                ->whereKey($data['workshop_id'])
                ->lockForUpdate()
                ->firstOrFail();

            $registration = Registration::query()
                ->where('workshop_id', $workshop->id)
                ->where('participant_id', $data['participant_id'])
                ->lockForUpdate()
                ->first();

            if ($registration && $registration->status === Registration::STATUS_REGISTERED) {
                return ['registration' => $registration, 'created' => false];
            }

            $activeRegistrations = $workshop->registrations()
                ->where('status', Registration::STATUS_REGISTERED)
                ->count();

            abort_if(
                $activeRegistrations >= $workshop->capacity,
                409,
                'This workshop has no available seats.',
            );

            ParticipantRef::query()->updateOrCreate(
                ['participant_id' => $data['participant_id']],
                [
                    'nom_affiche' => $data['nom_affiche'],
                    'email' => $data['email'],
                    'synced_at' => now(),
                ],
            );

            if ($registration) {
                $registration->status = Registration::STATUS_REGISTERED;
                $registration->registered_at = now();
                $registration->save();

                return ['registration' => $registration, 'created' => false];
            }

            $registration = Registration::query()->create([
                'workshop_id' => $workshop->id,
                'participant_id' => $data['participant_id'],
                'status' => Registration::STATUS_REGISTERED,
            ]);

            return ['registration' => $registration, 'created' => true];
        }, attempts: 3);
    }

    public function cancel(Registration $registration): Registration
    {
        if ($registration->status !== Registration::STATUS_CANCELLED) {
            $registration->status = Registration::STATUS_CANCELLED;
            $registration->save();
        }

        return $registration;
    }
}
