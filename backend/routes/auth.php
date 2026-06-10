<?php
function route_auth(array $seg, string $method): void {
    $action = $seg[1] ?? '';
    match (true) {
        $action === 'register' && $method === 'POST' => auth_register(),
        $action === 'login'    && $method === 'POST' => auth_login(),
        $action === 'me'       && $method === 'GET'  => auth_me(auth_required()),
        $action === 'me'       && $method === 'PATCH' => auth_update(auth_required()),
        default => json_err('Not found', 'NOT_FOUND', 404),
    };
}

function auth_register(): void {
    $b = body();
    require_fields($b, ['email', 'password', 'display_name']);
    if (!filter_var($b['email'], FILTER_VALIDATE_EMAIL)) json_err('Invalid email', 'VALIDATION_ERROR', 422);
    if (strlen($b['password']) < 8) json_err('Password min 8 chars', 'VALIDATION_ERROR', 422);

    $db = db();
    $stmt = $db->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$b['email']]);
    if ($stmt->fetch()) json_err('Email already taken', 'EMAIL_TAKEN', 409);

    $hash = password_hash($b['password'], PASSWORD_BCRYPT, ['cost' => 12]);
    $db->prepare("INSERT INTO users (email, password_hash, display_name) VALUES (?, ?, ?)")
       ->execute([$b['email'], $hash, trim($b['display_name'])]);
    $id = (int)$db->lastInsertId();

    json_ok(['token' => JWT::encode(['sub' => $id]), 'user' => fetch_user($db, $id)], 201);
}

function auth_login(): void {
    $b = body();
    require_fields($b, ['email', 'password']);

    $db = db();
    $stmt = $db->prepare("SELECT * FROM users WHERE email = ?");
    $stmt->execute([$b['email']]);
    $row = $stmt->fetch();

    if (!$row || !password_verify($b['password'], $row['password_hash'])) {
        json_err('Invalid credentials', 'INVALID_CREDENTIALS', 401);
    }
    json_ok(['token' => JWT::encode(['sub' => (int)$row['id']]), 'user' => user_to_obj($row)]);
}

function auth_me(array $session): void {
    json_ok(fetch_user(db(), $session['sub']));
}

function auth_update(array $session): void {
    $b = body();
    $db = db();
    $sets = [];
    $vals = [];
    foreach (['display_name', 'avatar_index', 'lang', 'theme'] as $f) {
        if (array_key_exists($f, $b)) { $sets[] = "$f = ?"; $vals[] = $b[$f]; }
    }
    if ($sets) {
        $vals[] = $session['sub'];
        $db->prepare("UPDATE users SET " . implode(', ', $sets) . " WHERE id = ?")->execute($vals);
    }
    json_ok(fetch_user($db, $session['sub']));
}

function fetch_user(PDO $db, int $id): array {
    $stmt = $db->prepare("SELECT id, email, display_name, avatar_index, lang, theme FROM users WHERE id = ?");
    $stmt->execute([$id]);
    return user_to_obj($stmt->fetch() ?: []);
}

function user_to_obj(array $r): array {
    return [
        'id'           => (int)$r['id'],
        'email'        => $r['email'],
        'display_name' => $r['display_name'],
        'avatar_index' => (int)$r['avatar_index'],
        'lang'         => $r['lang'],
        'theme'        => $r['theme'],
    ];
}
