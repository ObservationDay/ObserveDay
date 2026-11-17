<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\RegistrationResource;
use App\Models\Registration;
use App\Services\RegistrationService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class RegistrationController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Registration::query()->with(['workshop.trainer', 'participant']);

        if ($request->user()->role === 'formateur') {
            $query->whereHas('workshop', fn ($workshops) => $workshops
                ->where('trainer_id', $request->user()->id));
        }

        return RegistrationResource::collection(
            $query->orderByDesc('registered_at')->paginate($this->perPage($request)),
        );
    }

    public function show(Request $request, Registration $registration): RegistrationResource
    {
        $this->authorizeRegistrationAccess($request, $registration);

        return new RegistrationResource($registration->load(['workshop.trainer', 'participant']));
    }

    public function cancel(
        Request $request,
        Registration $registration,
        RegistrationService $service,
    ): RegistrationResource {
        $this->authorizeRegistrationAccess($request, $registration);

        return new RegistrationResource(
            $service->cancel($registration)->load(['workshop.trainer', 'participant']),
        );
    }

    private function authorizeRegistrationAccess(Request $request, Registration $registration): void
    {
        abort_if(
            $request->user()->role === 'formateur'
                && $registration->workshop()->where('trainer_id', $request->user()->id)->doesntExist(),
            404,
        );
    }

    private function perPage(Request $request): int
    {
        return max(1, min($request->integer('per_page', 15), 100));
    }
}
