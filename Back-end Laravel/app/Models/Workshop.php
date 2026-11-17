<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Workshop extends Model
{
    use HasUuids;

    protected $table = 'gestion.ateliers';

    public $timestamps = false;

    protected $fillable = [
        'titre',
        'description',
        'starts_at',
        'ends_at',
        'capacity',
        'status',
        'trainer_id',
    ];

    protected function casts(): array
    {
        return [
            'starts_at' => 'immutable_datetime',
            'ends_at' => 'immutable_datetime',
            'capacity' => 'integer',
            'created_at' => 'immutable_datetime',
        ];
    }

    public function scopeAvailableForRegistration(Builder $query): Builder
    {
        return $query
            ->where('starts_at', '>', now())
            ->whereRaw(
                'capacity > (SELECT COUNT(*) FROM gestion.inscriptions WHERE gestion.inscriptions.workshop_id = gestion.ateliers.id AND gestion.inscriptions.status = ?)',
                [Registration::STATUS_REGISTERED],
            );
    }

    public function trainer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'trainer_id');
    }

    public function registrations(): HasMany
    {
        return $this->hasMany(Registration::class, 'workshop_id');
    }
}
