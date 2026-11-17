<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ParticipantRefResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'participant_id' => $this->participant_id,
            'nom_affiche' => $this->nom_affiche,
            'email' => $this->email,
            'synced_at' => $this->synced_at,
        ];
    }
}
