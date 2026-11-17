<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\RegistrationResource;
use App\Models\Registration;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class IntegrationController extends Controller
{
    public function participantRegistrations(string $participantId): AnonymousResourceCollection
    {
        $registrations = Registration::query()
            ->with(['workshop.trainer', 'participant'])
            ->where('participant_id', $participantId)
            ->orderByDesc('registered_at')
            ->paginate(100);

        return RegistrationResource::collection($registrations);
    }
}
