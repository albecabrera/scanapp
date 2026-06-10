<?php
class JWT {
    private static string $secret = '';

    static function init(string $secret): void {
        self::$secret = $secret;
    }

    static function encode(array $payload, int $ttl = 604800): string {
        $header = self::b64u(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
        $payload['iat'] = time();
        $payload['exp'] = time() + $ttl;
        $body = self::b64u(json_encode($payload));
        $sig  = self::b64u(hash_hmac('sha256', "$header.$body", self::$secret, true));
        return "$header.$body.$sig";
    }

    static function decode(string $token): ?array {
        $parts = explode('.', $token);
        if (count($parts) !== 3) return null;
        [$h, $b, $s] = $parts;
        $expected = self::b64u(hash_hmac('sha256', "$h.$b", self::$secret, true));
        if (!hash_equals($expected, $s)) return null;
        $payload = json_decode(self::b64d($b), true);
        if (!$payload || ($payload['exp'] ?? 0) < time()) return null;
        return $payload;
    }

    private static function b64u(string $d): string {
        return rtrim(strtr(base64_encode($d), '+/', '-_'), '=');
    }
    private static function b64d(string $d): string {
        return base64_decode(strtr($d, '-_', '+/'));
    }
}
