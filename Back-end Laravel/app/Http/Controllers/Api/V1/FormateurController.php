<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreFormateurRequest;
use App\Http\Requests\UpdateFormateurRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Hash;

class FormateurController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        return UserResource::collection(
            User::query()
                ->where('role', 'formateur')
                ->orderBy('nom')
                ->paginate($this->perPage($request)),
        );
    }

    public function show(User $formateur): UserResource
    {
        abort_unless($formateur->role === 'formateur', 404);

        return (new UserResource($formateur))
            ->response()
            ->setStatusCode(201);
    }

    public function store(StoreFormateurRequest $request): JsonResponse
    {
        $data = $request->validated();
        $formateur = User::query()->create([
            'nom' => $data['nom'],
            'email' => $data['email'],
            'password_hash' => Hash::make($data['password']),
            'role' => 'formateur',
        ]);

        return new UserResource($formateur);
    }

    public function update(UpdateFormateurRequest $request, User $formateur): UserResource
    {
        abort_unless($formateur->role === 'formateur', 404);

        $data = $request->validated();
        if (isset($data['password'])) {
            $data['password_hash'] = Hash::make($data['password']);
            unset($data['password']);
        }

        $formateur->update($data);

        return new UserResource($formateur->refresh());
    }

    public function destroy(User $formateur): Response
    {
        abort_unless($formateur->role === 'formateur', 404);

        if ($formateur->workshops()->exists()) {
            return response()->json([
                'message' => 'A trainer assigned to workshops cannot be deleted.',
            ], 409);
        }

        $formateur->delete();

        return response()->noContent();
    }

    private function perPage(Request $request): int
    {
        return max(1, min($request->integer('per_page', 15), 100));
    }
}
