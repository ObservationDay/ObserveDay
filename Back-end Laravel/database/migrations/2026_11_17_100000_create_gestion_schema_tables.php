<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('CREATE SCHEMA IF NOT EXISTS gestion');

        Schema::create('gestion.utilisateurs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('nom', 120);
            $table->string('email', 255)->unique();
            $table->text('password_hash');
            $table->string('role', 20);
            $table->timestampTz('created_at')->useCurrent();
        });

        Schema::create('gestion.ateliers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('titre', 180);
            $table->text('description');
            $table->timestampTz('starts_at');
            $table->timestampTz('ends_at');
            $table->integer('capacity');
            $table->string('status');
            $table->uuid('trainer_id')->nullable();
            $table->timestampTz('created_at')->useCurrent();

            $table->foreign('trainer_id')
                ->references('id')
                ->on('gestion.utilisateurs');
        });

        Schema::create('gestion.participant_refs', function (Blueprint $table) {
            $table->uuid('participant_id')->primary();
            $table->string('nom_affiche', 120);
            $table->string('email', 255);
            $table->timestampTz('synced_at')->useCurrent();
        });

        Schema::create('gestion.inscriptions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('workshop_id');
            $table->uuid('participant_id');
            $table->string('status', 20)->default('inscrit');
            $table->timestampTz('registered_at')->useCurrent();

            $table->foreign('workshop_id')
                ->references('id')
                ->on('gestion.ateliers');
            $table->foreign('participant_id')
                ->references('participant_id')
                ->on('gestion.participant_refs');
            $table->unique(
                ['workshop_id', 'participant_id'],
                'inscriptions_workshop_participant_unique',
            );
        });

        Schema::create('gestion.personal_access_tokens', function (Blueprint $table) {
            $table->id();
            $table->uuidMorphs('tokenable');
            $table->text('name');
            $table->string('token', 64)->unique();
            $table->text('abilities')->nullable();
            $table->timestamp('last_used_at')->nullable();
            $table->timestamp('expires_at')->nullable()->index();
            $table->timestamps();
        });

        DB::statement("ALTER TABLE gestion.utilisateurs ADD CONSTRAINT utilisateurs_role_check CHECK (role IN ('admin', 'formateur'))");
        DB::statement('ALTER TABLE gestion.ateliers ADD CONSTRAINT ateliers_capacity_check CHECK (capacity > 0)');
        DB::statement('ALTER TABLE gestion.ateliers ADD CONSTRAINT ateliers_dates_check CHECK (ends_at > starts_at)');
        DB::statement("ALTER TABLE gestion.inscriptions ADD CONSTRAINT inscriptions_status_check CHECK (status IN ('inscrit', 'annule'))");
    }

    public function down(): void
    {
        Schema::dropIfExists('gestion.personal_access_tokens');
        Schema::dropIfExists('gestion.inscriptions');
        Schema::dropIfExists('gestion.participant_refs');
        Schema::dropIfExists('gestion.ateliers');
        Schema::dropIfExists('gestion.utilisateurs');
        DB::statement('DROP SCHEMA IF EXISTS gestion');
    }
};
