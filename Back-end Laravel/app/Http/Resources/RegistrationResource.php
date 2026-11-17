<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RegistrationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'workshop_id' => $this->workshop_id,
            'participant_id' => $this->participant_id,
            'status' => $this->status,
            'registered_at' => $this->registered_at,
            'workshop' => WorkshopResource::make($this->whenLoaded('workshop')),
            'participant' => ParticipantRefResource::make($this->whenLoaded('participant')),
        ];
    }
}
