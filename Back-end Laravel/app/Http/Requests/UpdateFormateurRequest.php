<?php

namespace App\Http\Requests;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class UpdateFormateurRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $formateur = $this->route('formateur');

        return [
            'nom' => ['sometimes', 'required', 'string', 'max:120'],
            'email' => [
                'sometimes',
                'required',
                'email',
                'max:255',
                Rule::unique(User::class, 'email')->ignore($formateur->id),
            ],
            'password' => ['sometimes', 'required', 'string', Password::min(12), 'confirmed'],
        ];
    }
}
