<?php
/**
 * Minimal Web Push sender — RFC 8291 (aes128gcm) + RFC 8292 (VAPID, ES256).
 * Pure PHP + openssl, no Composer.
 */
class WebPush {

    /**
     * @param array  $sub     ['endpoint' => string, 'p256dh' => base64url, 'auth' => base64url]
     * @param string $payload JSON string shown by the service worker
     * @return int HTTP status code (201 = delivered; 404/410 = subscription dead)
     */
    public static function send(array $sub, string $payload, int $ttl = 86400): int {
        $uaPublic   = self::b64url_decode($sub['p256dh']); // 65-byte uncompressed point
        $authSecret = self::b64url_decode($sub['auth']);   // 16 bytes

        // Ephemeral sender keypair
        $eph = openssl_pkey_new(['ec' => ['curve_name' => 'prime256v1']]);
        $ephDetails = openssl_pkey_get_details($eph);
        $asPublic = "\x04"
            . str_pad($ephDetails['ec']['x'], 32, "\0", STR_PAD_LEFT)
            . str_pad($ephDetails['ec']['y'], 32, "\0", STR_PAD_LEFT);

        // ECDH shared secret with the subscriber key
        $peerPem = self::raw_point_to_pem($uaPublic);
        $shared  = openssl_pkey_derive($peerPem, $eph);
        if ($shared === false) return 0;

        // HKDF chain (RFC 8291 §3.3–3.4)
        $ikm   = hash_hkdf('sha256', $shared, 32, "WebPush: info\0" . $uaPublic . $asPublic, $authSecret);
        $salt  = random_bytes(16);
        $cek   = hash_hkdf('sha256', $ikm, 16, "Content-Encoding: aes128gcm\0", $salt);
        $nonce = hash_hkdf('sha256', $ikm, 12, "Content-Encoding: nonce\0", $salt);

        // Single record: payload + 0x02 delimiter (last record)
        $tag = '';
        $ciphertext = openssl_encrypt($payload . "\x02", 'aes-128-gcm', $cek, OPENSSL_RAW_DATA, $nonce, $tag);
        if ($ciphertext === false) return 0;

        // aes128gcm body header: salt(16) | rs(4) | idlen(1) | keyid(65)
        $body = $salt . pack('N', 4096) . chr(65) . $asPublic . $ciphertext . $tag;

        $jwt = self::vapid_jwt($sub['endpoint']);
        if ($jwt === null) return 0;

        $ch = curl_init($sub['endpoint']);
        curl_setopt_array($ch, [
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => $body,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 15,
            CURLOPT_HTTPHEADER     => [
                'Content-Type: application/octet-stream',
                'Content-Encoding: aes128gcm',
                'Content-Length: ' . strlen($body),
                'TTL: ' . $ttl,
                'Urgency: normal',
                'Authorization: vapid t=' . $jwt . ', k=' . VAPID_PUBLIC_KEY,
            ],
        ]);
        curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        return $code;
    }

    // ── VAPID (RFC 8292) ──────────────────────────────────────────────────

    private static function vapid_jwt(string $endpoint): ?string {
        $parts = parse_url($endpoint);
        $aud   = $parts['scheme'] . '://' . $parts['host'] . (isset($parts['port']) ? ':' . $parts['port'] : '');

        $header = self::b64url_encode(json_encode(['typ' => 'JWT', 'alg' => 'ES256']));
        $claims = self::b64url_encode(json_encode([
            'aud' => $aud,
            'exp' => time() + 43200,
            'sub' => VAPID_SUBJECT,
        ]));
        $signingInput = $header . '.' . $claims;

        $priv = openssl_pkey_get_private('file://' . VAPID_PRIVATE_PEM);
        if ($priv === false) return null;

        $derSig = '';
        if (!openssl_sign($signingInput, $derSig, $priv, OPENSSL_ALGO_SHA256)) return null;

        return $signingInput . '.' . self::b64url_encode(self::der_to_raw_sig($derSig));
    }

    /** ECDSA DER signature → raw r||s (64 bytes) as JWS requires */
    private static function der_to_raw_sig(string $der): string {
        $pos = 2; // skip SEQUENCE header (assumes short-form length)
        if (ord($der[1]) & 0x80) $pos += ord($der[1]) & 0x7F;

        $pos++; // 0x02
        $rLen = ord($der[$pos++]);
        $r = substr($der, $pos, $rLen); $pos += $rLen;

        $pos++; // 0x02
        $sLen = ord($der[$pos++]);
        $s = substr($der, $pos, $sLen);

        $r = str_pad(ltrim($r, "\0"), 32, "\0", STR_PAD_LEFT);
        $s = str_pad(ltrim($s, "\0"), 32, "\0", STR_PAD_LEFT);
        return $r . $s;
    }

    // ── Key helpers ───────────────────────────────────────────────────────

    /** 65-byte uncompressed P-256 point → SubjectPublicKeyInfo PEM */
    private static function raw_point_to_pem(string $point): string {
        $der = hex2bin('3059301306072a8648ce3d020106082a8648ce3d030107034200') . $point;
        return "-----BEGIN PUBLIC KEY-----\n"
            . chunk_split(base64_encode($der), 64, "\n")
            . "-----END PUBLIC KEY-----\n";
    }

    public static function b64url_encode(string $s): string {
        return rtrim(strtr(base64_encode($s), '+/', '-_'), '=');
    }

    public static function b64url_decode(string $s): string {
        return base64_decode(strtr($s, '-_', '+/') . str_repeat('=', (4 - strlen($s) % 4) % 4));
    }
}
