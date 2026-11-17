<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\ParticipantRefResource;
use App\Models\ParticipantRef;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ParticipantRefController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = ParticipantRef::query();

        if ($request->user()->role === 'formateur') {
            $query->whereHas('registrations.workshop', fn ($workshops) => $workshops
                ->where('trainer_id', $request->user()->id));
        }

        return ParticipantRefResource::collection(
            $query->orderBy('nom_affiche')->paginate($this->perPage($request)),
        );
    }

    public function show(Request $request, ParticipantRef $participantRef): ParticipantRefResource
    {
        if (
            $request->user()->role === 'formateur'
            && ! $participantRef->registrations()
                ->whereHas('workshop', fn ($workshops) => $workshops
                    ->where('trainer_id', $request->user()->id))
                ->exists()
        ) {
            abort(404);
        }

        return new ParticipantRefResource($participantRef);
    }

    private function perPage(Request $request): int
    {
        return max(1, min($request->integer('per_page', 15), 100));
    }
}
