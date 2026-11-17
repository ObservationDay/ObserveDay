<?php

namespace App\Http\Requests;

use App\Models\Workshop;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreRegistrationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'workshop_id' => ['required', 'uuid', Rule::exists(Workshop::class, 'id')],
            'participant_id' => ['required', 'uuid'],
            'nom_affiche' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:255'],
        ];
    }
}
