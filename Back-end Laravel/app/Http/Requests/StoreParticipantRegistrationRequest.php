<?php

namespace App\Http\Requests;

use App\Models\Workshop;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreParticipantRegistrationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'workshop_id' => ['required', 'uuid', Rule::exists(Workshop::class, 'id')],
        ];
    }
}
