<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use JsonException;
use RuntimeException;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateParticipantJwt
{
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->bearerToken();
        if (! $token) {
            return response()->json(['message' => 'Unauthenticated.'], Response::HTTP_UNAUTHORIZED);
        }

        $secret = config('services.participant_jwt.secret');
        if (! is_string($secret) || strlen($secret) < 32) {
            throw new RuntimeException('PARTICIPANT_JWT_SECRET must contain at least 32 characters.');
        }

        $claims = $this->decodeToken($token, $secret);
        if ($claims === null) {
            return response()->json(['message' => 'Unauthenticated.'], Response::HTTP_UNAUTHORIZED);
        }

        $request->attributes->set('participant_id', $claims['sub']);
        $request->attributes->set('participant_name', $claims['participant_name']);
        $request->attributes->set('participant_email', $claims['participant_email']);

        return $next($request);
    }

    /**
     * @return array<string, mixed>|null
     */
    private function decodeToken(string $token, string $secret): ?array
    {
        if (strlen($token) > 4096) {
            return null;
        }

        $segments = explode('.', $token);
        if (count($segments) !== 3) {
            return null;
        }

        $headerJson = $this->decodeSegment($segments[0]);
        $claimsJson = $this->decodeSegment($segments[1]);
        $signature = $this->decodeSegment($segments[2]);
        if ($headerJson === null || $claimsJson === null || $signature === null) {
            return null;
        }

        try {
            $header = json_decode($headerJson, true, 512, JSON_THROW_ON_ERROR);
            $claims = json_decode($claimsJson, true, 512, JSON_THROW_ON_ERROR);
        } catch (JsonException) {
            return null;
        }

        if (! is_array($header) || ! is_array($claims)
            || ($header['alg'] ?? null) !== 'HS256'
            || ($header['typ'] ?? null) !== 'JWT'
            || ! hash_equals(hash_hmac('sha256', "{$segments[0]}.{$segments[1]}", $secret, true), $signature)
        ) {
            return null;
        }

        $now = time();
        $participantId = $claims['sub'] ?? null;
        $participantName = $claims['participant_name'] ?? null;
        $participantEmail = $claims['participant_email'] ?? null;

        if (($claims['type'] ?? null) !== 'access'
            || ! is_int($claims['exp'] ?? null)
            || $claims['exp'] <= $now
            || (isset($claims['iat']) && (! is_int($claims['iat']) || $claims['iat'] > $now))
            || (isset($claims['nbf']) && (! is_int($claims['nbf']) || $claims['nbf'] > $now))
            || ! is_string($participantId)
            || ! preg_match('/\A[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}\z/i', $participantId)
            || ! is_string($participantName)
            || trim($participantName) === ''
            || mb_strlen($participantName) > 120
            || ! is_string($participantEmail)
            || strlen($participantEmail) > 255
            || filter_var($participantEmail, FILTER_VALIDATE_EMAIL) === false
        ) {
            return null;
        }

        return $claims;
    }

    private function decodeSegment(string $segment): ?string
    {
        if ($segment === '' || ! preg_match('/\A[A-Za-z0-9_-]+\z/', $segment)) {
            return null;
        }

        $base64 = strtr($segment, '-_', '+/');
        $base64 .= str_repeat('=', (4 - strlen($base64) % 4) % 4);
        $decoded = base64_decode($base64, true);

        return $decoded === false ? null : $decoded;
    }
}
