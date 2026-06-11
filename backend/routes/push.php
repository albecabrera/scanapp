<?php
function route_push(array $seg, string $method): void {
    // Public: VAPID application server key for PushManager.subscribe()
    if (($seg[1] ?? '') === 'vapid-key') {
        if ($method !== 'GET') json_err('Method not allowed', 'METHOD_NOT_ALLOWED', 405);
        json_ok(['key' => VAPID_PUBLIC_KEY]);
    }

    $user = auth_required();
    if (($seg[1] ?? '') !== 'subscribe') json_err('Not found', 'NOT_FOUND', 404);
    match ($method) {
        'POST'   => push_subscribe($user),
        'DELETE' => push_unsubscribe($user),
        default  => json_err('Method not allowed', 'METHOD_NOT_ALLOWED', 405),
    };
}

function push_subscribe(array $session): void {
    $b = body();
    require_fields($b, ['endpoint', 'p256dh', 'auth']);
    $db = db();
    $db->prepare("
        INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, user_agent)
        VALUES (?, ?, ?, ?, ?)
    ")->execute([$session['sub'], $b['endpoint'], $b['p256dh'], $b['auth'], $b['user_agent'] ?? '']);
    json_ok(['id' => (int)$db->lastInsertId()], 201);
}

function push_unsubscribe(array $session): void {
    $b = body();
    require_fields($b, ['endpoint']);
    db()->prepare("DELETE FROM push_subscriptions WHERE user_id = ? AND endpoint = ?")->execute([$session['sub'], $b['endpoint']]);
    http_response_code(204); exit;
}
