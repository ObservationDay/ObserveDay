<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreRegistrationRequest;
use App\Http\Resources\RegistrationResource;
use App\Http\Resources\WorkshopResource;
use App\Models\Registration;
use App\Models\Workshop;
use App\Services\RegistrationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\Response;

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

    public function workshop(string $workshop): WorkshopResource
    {
        $availableWorkshop = Workshop::query()
            ->availableForRegistration()
            ->with('trainer')
            ->withCount([
                'registrations as active_registrations_count' => fn ($query) => $query
                    ->where('status', Registration::STATUS_REGISTERED),
            ])
            ->whereKey($workshop)
            ->firstOrFail();

        return new WorkshopResource($availableWorkshop);
    }

    public function register(
        StoreRegistrationRequest $request,
        RegistrationService $service,
    ): JsonResponse {
        $result = $service->registerParticipant($request->validated());
        $registration = $result['registration']->load(['workshop.trainer', 'participant']);

        return (new RegistrationResource($registration))
            ->response()
            ->setStatusCode($result['created'] ? Response::HTTP_CREATED : Response::HTTP_OK);
    }

    public function cancelRegistration(
        Registration $registration,
        RegistrationService $service,
    ): RegistrationResource {
        return new RegistrationResource(
            $service->cancel($registration)->load(['workshop.trainer', 'participant']),
        );
    }
}
