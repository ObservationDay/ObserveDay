<?php

namespace App\Http\Requests;

use App\Models\User;
use App\Models\Workshop;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateWorkshopRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'titre' => ['sometimes', 'required', 'string', 'max:180'],
            'description' => ['sometimes', 'required', 'string'],
            'starts_at' => ['sometimes', 'required', 'date'],
            'ends_at' => ['sometimes', 'required', 'date'],
            'capacity' => ['sometimes', 'required', 'integer', 'min:1'],
            'status' => ['sometimes', 'required', 'string', 'max:50'],
            'trainer_id' => [
                'sometimes',
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
                if ($validator->errors()->has('starts_at') || $validator->errors()->has('ends_at')) {
                    return;
                }

                $workshop = $this->route('workshop');
                $startsAt = $this->input('starts_at', $workshop->starts_at);
                $endsAt = $this->input('ends_at', $workshop->ends_at);

                if (strtotime((string) $endsAt) <= strtotime((string) $startsAt)) {
                    $validator->errors()->add('ends_at', 'The end date must be after the start date.');

                    return;
                }

                if (
                    $validator->errors()->has('trainer_id')
                    || $validator->errors()->has('status')
                ) {
                    return;
                }

                $trainerId = $this->input('trainer_id', $workshop->trainer_id);
                $status = $this->input('status', $workshop->status);

                if (! $trainerId || $status === Workshop::STATUS_CANCELLED) {
                    return;
                }

                $hasOverlap = Workshop::query()
                    ->overlappingSchedule(
                        (string) $trainerId,
                        $startsAt,
                        $endsAt,
                    )
                    ->where('id', '<>', $workshop->getKey())
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
