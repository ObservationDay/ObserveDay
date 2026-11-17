<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class WorkshopResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $activeRegistrations = $this->active_registrations_count ?? null;

        return [
            'id' => $this->id,
            'titre' => $this->titre,
            'description' => $this->description,
            'starts_at' => $this->starts_at,
            'ends_at' => $this->ends_at,
            'capacity' => $this->capacity,
            'status' => $this->status,
            'trainer' => UserResource::make($this->whenLoaded('trainer')),
            'active_registrations' => $this->when(
                ! is_null($activeRegistrations),
                (int) $activeRegistrations,
            ),
            'available_seats' => $this->when(
                ! is_null($activeRegistrations),
                max(0, $this->capacity - $activeRegistrations),
            ),
            'created_at' => $this->created_at,
        ];
    }
}
