<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Registration extends Model
{
    use HasUuids;

    public const STATUS_REGISTERED = 'inscrit';

    public const STATUS_CANCELLED = 'annule';

    protected $table = 'gestion.inscriptions';

    public $timestamps = false;

    protected $fillable = [
        'workshop_id',
        'participant_id',
        'status',
        'registered_at',
    ];

    protected function casts(): array
    {
        return [
            'registered_at' => 'immutable_datetime',
        ];
    }

    public function workshop(): BelongsTo
    {
        return $this->belongsTo(Workshop::class, 'workshop_id');
    }

    public function participant(): BelongsTo
    {
        return $this->belongsTo(ParticipantRef::class, 'participant_id');
    }
}
