<?php
function route_health(): void {
    $db_ok = false;
    $db_error = null;

    try {
        db()->query('SELECT 1');
        $db_ok = true;
    } catch (Throwable $e) {
        $db_error = $e->getMessage();
    }

    $status = $db_ok ? 'ok' : 'degraded';
    $code   = $db_ok ? 200 : 503;

    $payload = [
        'status'    => $status,
        'timestamp' => gmdate('c'),
        'services'  => [
            'database' => $db_ok ? 'connected' : 'error',
        ],
    ];

    if ($db_error && defined('APP_ENV') && APP_ENV === 'development') {
        $payload['debug'] = $db_error;
    }

    json_ok($payload, $code);
}
