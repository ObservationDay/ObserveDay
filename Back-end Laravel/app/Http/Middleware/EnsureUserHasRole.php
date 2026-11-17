<?php

namespace App\Http\Middleware;

use App\Models\PersonalAccessToken;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserHasRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();
        $token = $request->bearerToken()
            ? PersonalAccessToken::findToken($request->bearerToken())
            : $user?->currentAccessToken();
        $hasStaffAccess = ! ($token instanceof PersonalAccessToken)
            || (
                $token->tokenable_id === $user?->getAuthIdentifier()
                && ($token->can('*') || $token->can('staff:access'))
            );

        if (! $user || ! in_array($user->role, $roles, true) || ! $hasStaffAccess) {
            return response()->json(['message' => 'Forbidden.'], Response::HTTP_FORBIDDEN);
        }

        return $next($request);
    }
}
