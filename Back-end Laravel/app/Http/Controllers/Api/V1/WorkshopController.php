<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreWorkshopRequest;
use App\Http\Requests\UpdateWorkshopRequest;
use App\Http\Resources\WorkshopResource;
use App\Models\Registration;
use App\Models\Workshop;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Validation\ValidationException;

class WorkshopController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = $this->workshopsWithCounts();

        if ($request->user()->role === 'formateur') {
            $query->where('trainer_id', $request->user()->id);
        }

        return WorkshopResource::collection(
            $query->orderBy('starts_at')->paginate($this->perPage($request)),
        );
    }

    public function show(Request $request, Workshop $workshop): WorkshopResource
    {
        $this->authorizeWorkshopAccess($request, $workshop);

        return new WorkshopResource(
            $workshop->load('trainer')->loadCount($this->activeRegistrationCount()),
        );
    }

    public function store(StoreWorkshopRequest $request): JsonResponse
    {
        $workshop = Workshop::query()->create($request->validated());

        return (new WorkshopResource($workshop->load('trainer')))
            ->response()
            ->setStatusCode(201);
    }

    public function update(UpdateWorkshopRequest $request, Workshop $workshop): WorkshopResource
    {
        $data = $request->validated();
        $activeRegistrationCount = $workshop->registrations()
            ->where('status', Registration::STATUS_REGISTERED)
            ->count();

        if (isset($data['capacity']) && $data['capacity'] < $activeRegistrationCount) {
            throw ValidationException::withMessages([
                'capacity' => 'Capacity cannot be lower than the number of active registrations.',
            ]);
        }

        $workshop->update($data);

        return new WorkshopResource(
            $workshop->refresh()->load('trainer')->loadCount($this->activeRegistrationCount()),
        );
    }

    public function destroy(Workshop $workshop): Response
    {
        if ($workshop->registrations()->exists()) {
            return response()->json([
                'message' => 'A workshop with registration history cannot be deleted.',
            ], 409);
        }

        $workshop->delete();

        return response()->noContent();
    }

    private function authorizeWorkshopAccess(Request $request, Workshop $workshop): void
    {
        abort_if(
            $request->user()->role === 'formateur' && $workshop->trainer_id !== $request->user()->id,
            404,
        );
    }

    private function workshopsWithCounts()
    {
        return Workshop::query()
            ->with('trainer')
            ->withCount($this->activeRegistrationCount());
    }

    private function activeRegistrationCount(): array
    {
        return [
            'registrations as active_registrations_count' => fn ($query) => $query
                ->where('status', Registration::STATUS_REGISTERED),
        ];
    }

    private function perPage(Request $request): int
    {
        return max(1, min($request->integer('per_page', 15), 100));
    }
}
