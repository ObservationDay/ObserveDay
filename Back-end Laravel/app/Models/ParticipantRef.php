<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ParticipantRef extends Model
{
    protected $table = 'gestion.participant_refs';

    protected $primaryKey = 'participant_id';

    public $incrementing = false;

    public $timestamps = false;

    protected $keyType = 'string';

    protected $fillable = [
        'participant_id',
        'nom_affiche',
        'email',
        'synced_at',
    ];

    protected function casts(): array
    {
        return [
            'synced_at' => 'immutable_datetime',
        ];
    }

    public function registrations(): HasMany
    {
        return $this->hasMany(Registration::class, 'participant_id');
    }
}
