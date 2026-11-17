<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreParticipantRegistrationRequest;
use App\Http\Resources\RegistrationResource;
use App\Http\Resources\WorkshopResource;
use App\Models\Registration;
use App\Models\Workshop;
use App\Services\RegistrationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\Response;

class ParticipantPortalController extends Controller
{
    public function workshops(): AnonymousResourceCollection
    {
        $workshops = Workshop::query()
            ->availableForRegistration()
            ->with('trainer')
            ->withCount([
                'registrations as active_registrations_count' => fn ($query) => $query
                    ->where('status', Registration::STATUS_REGISTERED),
            ])
            ->orderBy('starts_at')
            ->paginate(15);

        return WorkshopResource::collection($workshops);
    }

    public function register(
        StoreParticipantRegistrationRequest $request,
        RegistrationService $service,
    ): JsonResponse {
        $result = $service->registerParticipant([
            ...$request->validated(),
            'participant_id' => $request->attributes->get('participant_id'),
            'nom_affiche' => $request->attributes->get('participant_name'),
            'email' => $request->attributes->get('participant_email'),
        ]);
        $registration = $result['registration']->load(['workshop.trainer', 'participant']);

        return (new RegistrationResource($registration))
            ->response()
            ->setStatusCode($result['created'] ? Response::HTTP_CREATED : Response::HTTP_OK);
    }
}
