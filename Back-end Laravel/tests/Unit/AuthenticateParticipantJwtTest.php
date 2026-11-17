<?php

namespace Tests\Unit;

use App\Http\Middleware\AuthenticateParticipantJwt;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Tests\TestCase;

class AuthenticateParticipantJwtTest extends TestCase
{
    public function test_accepts_a_valid_flask_participant_token(): void
    {
        $secret = 'test-participant-jwt-secret-with-at-least-thirty-two-characters';
        config(['services.participant_jwt.secret' => $secret]);
        $participantId = '0956d685-98ad-49f7-81e2-7439a3e4987c';
        $request = Request::create('/api/v1/participant/inscriptions', 'POST');
        $request->headers->set('Authorization', 'Bearer '.$this->participantToken($secret, [
            'sub' => $participantId,
            'type' => 'access',
            'iat' => time(),
            'exp' => time() + 1800,
            'participant_name' => 'Participant Test',
            'participant_email' => 'participant@example.test',
        ]));

        $response = (new AuthenticateParticipantJwt())->handle(
            $request,
            function (Request $request) use ($participantId): Response {
                $this->assertSame($participantId, $request->attributes->get('participant_id'));
                $this->assertSame('Participant Test', $request->attributes->get('participant_name'));
                $this->assertSame('participant@example.test', $request->attributes->get('participant_email'));

                return response()->noContent();
            },
        );

        $this->assertSame(Response::HTTP_NO_CONTENT, $response->getStatusCode());
    }

    public function test_rejects_a_tampered_participant_token(): void
    {
        $secret = 'test-participant-jwt-secret-with-at-least-thirty-two-characters';
        config(['services.participant_jwt.secret' => $secret]);
        $token = $this->participantToken($secret, [
            'sub' => '0956d685-98ad-49f7-81e2-7439a3e4987c',
            'type' => 'access',
            'iat' => time(),
            'exp' => time() + 1800,
            'participant_name' => 'Participant Test',
            'participant_email' => 'participant@example.test',
        ]);
        $request = Request::create('/api/v1/participant/inscriptions', 'POST');
        $request->headers->set('Authorization', 'Bearer '.$token.'x');

        $response = (new AuthenticateParticipantJwt())->handle(
            $request,
            fn (): never => $this->fail('A tampered token must not reach the endpoint.'),
        );

        $this->assertSame(Response::HTTP_UNAUTHORIZED, $response->getStatusCode());
    }

    /**
     * @param array<string, mixed> $claims
     */
    private function participantToken(string $secret, array $claims): string
    {
        $encode = static fn (array $value): string => rtrim(strtr(
            base64_encode(json_encode($value, JSON_THROW_ON_ERROR)),
            '+/',
            '-_',
        ), '=');

        $header = $encode(['alg' => 'HS256', 'typ' => 'JWT']);
        $payload = $encode($claims);
        $signature = rtrim(strtr(
            base64_encode(hash_hmac('sha256', "{$header}.{$payload}", $secret, true)),
            '+/',
            '-_',
        ), '=');

        return "{$header}.{$payload}.{$signature}";
    }
}
