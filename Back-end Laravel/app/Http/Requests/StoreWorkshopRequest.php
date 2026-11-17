<?php

namespace App\Http\Requests;

use App\Models\User;
use App\Models\Workshop;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreWorkshopRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'titre' => ['required', 'string', 'max:180'],
            'description' => ['required', 'string'],
            'starts_at' => ['required', 'date'],
            'ends_at' => ['required', 'date', 'after:starts_at'],
            'capacity' => ['required', 'integer', 'min:1'],
            'status' => ['required', 'string', 'max:50'],
            'trainer_id' => [
                'nullable',
                'uuid',
                Rule::exists(User::class, 'id')->where('role', 'formateur'),
            ],
        ];
    }

    public function after(): array
    {
        return [
            function (Validator $validator): void {
                if (
                    $validator->errors()->has('starts_at')
                    || $validator->errors()->has('ends_at')
                    || $validator->errors()->has('trainer_id')
                    || $validator->errors()->has('status')
                ) {
                    return;
                }

                $trainerId = $this->input('trainer_id');
                $startsAt = $this->input('starts_at');
                $endsAt = $this->input('ends_at');

                if (
                    ! is_string($trainerId)
                    || ! is_string($startsAt)
                    || ! is_string($endsAt)
                    || $this->input('status') === Workshop::STATUS_CANCELLED
                ) {
                    return;
                }

                $hasOverlap = Workshop::query()
                    ->overlappingSchedule($trainerId, $startsAt, $endsAt)
                    ->exists();

                if ($hasOverlap) {
                    $validator->errors()->add(
                        'trainer_id',
                        'The trainer already has a workshop scheduled during this time.',
                    );
                }
            },
        ];
    }
}
