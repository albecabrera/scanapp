<?php
function route_households(array $seg, string $method): void {
    $hid = isset($seg[1]) ? (int)$seg[1] : null;

    if ($hid === null) {
        $user = auth_required();
        match ($method) {
            'GET'  => hh_list($user),
            'POST' => hh_create($user),
            default => json_err('Method not allowed', 'METHOD_NOT_ALLOWED', 405),
        };
        return;
    }

    $sub  = $seg[2] ?? '';
    $sub2 = $seg[3] ?? '';
    $sub3 = $seg[4] ?? '';

    // /households/:id/members/:userId
    if ($sub === 'members' && $sub2 !== '') {
        $user = auth_required();
        $tid  = (int)$sub2;
        match ($method) {
            'DELETE' => hh_member_remove($user, $hid, $tid),
            'PATCH'  => hh_member_role($user, $hid, $tid),
            default  => json_err('Method not allowed', 'METHOD_NOT_ALLOWED', 405),
        };
        return;
    }

    // /households/:id/invites/active
    if ($sub === 'invites' && $sub2 === 'active') {
        $user = auth_required();
        if ($method !== 'GET') json_err('Method not allowed', 'METHOD_NOT_ALLOWED', 405);
        hh_invite_active($user, $hid);
        return;
    }

    // /households/:id/invites
    if ($sub === 'invites') {
        $user = auth_required();
        if ($method !== 'POST') json_err('Method not allowed', 'METHOD_NOT_ALLOWED', 405);
        hh_invite_create($user, $hid);
        return;
    }

    // /households/:id/items/:itemId/consume
    if ($sub === 'items' && $sub2 !== '' && $sub3 === 'consume') {
        $user = auth_required();
        if ($method !== 'POST') json_err('Method not allowed', 'METHOD_NOT_ALLOWED', 405);
        item_consume($user, $hid, (int)$sub2);
        return;
    }

    // /households/:id/items/:itemId
    if ($sub === 'items' && $sub2 !== '') {
        $user = auth_required();
        match ($method) {
            'PATCH'  => item_update($user, $hid, (int)$sub2),
            'DELETE' => item_delete($user, $hid, (int)$sub2),
            default  => json_err('Method not allowed', 'METHOD_NOT_ALLOWED', 405),
        };
        return;
    }

    // /households/:id/items
    if ($sub === 'items') {
        $user = auth_required();
        match ($method) {
            'GET'  => items_list($user, $hid),
            'POST' => item_create($user, $hid),
            default => json_err('Method not allowed', 'METHOD_NOT_ALLOWED', 405),
        };
        return;
    }

    // /households/:id/notifications/me
    if ($sub === 'notifications' && $sub2 === 'me') {
        $user = auth_required();
        if ($method !== 'PATCH') json_err('Method not allowed', 'METHOD_NOT_ALLOWED', 405);
        notif_update_me($user, $hid);
        return;
    }

    // /households/:id/notifications
    if ($sub === 'notifications') {
        $user = auth_required();
        match ($method) {
            'GET'   => notif_get($user, $hid),
            'PATCH' => notif_update($user, $hid),
            default => json_err('Method not allowed', 'METHOD_NOT_ALLOWED', 405),
        };
        return;
    }

    // /households/:id
    $user = auth_required();
    match ($method) {
        'PATCH'  => hh_update($user, $hid),
        'DELETE' => hh_delete($user, $hid),
        default  => json_err('Method not allowed', 'METHOD_NOT_ALLOWED', 405),
    };
}

function route_invites_join(string $method): void {
    $user = auth_required();
    if ($method !== 'POST') json_err('Method not allowed', 'METHOD_NOT_ALLOWED', 405);
    invites_join($user);
}

// ─── Households ────────────────────────────────────────────────────────────

function hh_list(array $session): void {
    $db   = db();
    $stmt = $db->prepare("
        SELECT h.id, h.name, hm.role
        FROM households h
        JOIN household_members hm ON hm.household_id = h.id AND hm.user_id = ?
        ORDER BY h.created_at ASC
    ");
    $stmt->execute([$session['sub']]);
    $rows = $stmt->fetchAll();

    $households = array_map(fn($r) => [
        'id'           => (int)$r['id'],
        'name'         => $r['name'],
        'role'         => $r['role'],
        'member_count' => hh_member_count($db, (int)$r['id']),
        'members'      => hh_members($db, (int)$r['id']),
    ], $rows);

    json_ok(['households' => $households]);
}

function hh_create(array $session): void {
    $b = body();
    require_fields($b, ['name']);
    $db = db();

    $db->beginTransaction();
    try {
        $db->prepare("INSERT INTO households (name, created_by) VALUES (?, ?)")->execute([$b['name'], $session['sub']]);
        $id = (int)$db->lastInsertId();
        $db->prepare("INSERT INTO household_members (household_id, user_id, role) VALUES (?, ?, 'admin')")->execute([$id, $session['sub']]);
        $db->prepare("INSERT INTO notification_settings (household_id) VALUES (?)")->execute([$id]);
        $db->commit();
    } catch (Throwable $e) {
        $db->rollBack();
        json_err('Server error', 'SERVER_ERROR', 500);
    }

    json_ok([
        'id'           => $id,
        'name'         => $b['name'],
        'role'         => 'admin',
        'member_count' => 1,
        'members'      => hh_members($db, $id),
    ], 201);
}

function hh_update(array $session, int $hid): void {
    $db = db();
    admin_required($db, $hid, $session['sub']);
    $b = body();
    require_fields($b, ['name']);
    $db->prepare("UPDATE households SET name = ? WHERE id = ?")->execute([$b['name'], $hid]);
    json_ok(['id' => $hid, 'name' => $b['name'], 'members' => hh_members($db, $hid)]);
}

function hh_delete(array $session, int $hid): void {
    admin_required(db(), $hid, $session['sub']);
    db()->prepare("DELETE FROM households WHERE id = ?")->execute([$hid]);
    http_response_code(204); exit;
}

// ─── Members ───────────────────────────────────────────────────────────────

function hh_member_remove(array $session, int $hid, int $tid): void {
    $db = db();
    admin_required($db, $hid, $session['sub']);
    if ($tid === $session['sub']) {
        $stmt = $db->prepare("SELECT COUNT(*) as c FROM household_members WHERE household_id = ? AND role = 'admin'");
        $stmt->execute([$hid]);
        if ((int)$stmt->fetch()['c'] <= 1) json_err('Cannot remove last admin', 'LAST_ADMIN', 409);
    }
    $db->prepare("DELETE FROM household_members WHERE household_id = ? AND user_id = ?")->execute([$hid, $tid]);
    http_response_code(204); exit;
}

function hh_member_role(array $session, int $hid, int $tid): void {
    $db = db();
    admin_required($db, $hid, $session['sub']);
    $b = body();
    require_fields($b, ['role']);
    if (!in_array($b['role'], ['admin', 'member'], true)) json_err('Invalid role', 'VALIDATION_ERROR', 422);
    $db->prepare("UPDATE household_members SET role = ? WHERE household_id = ? AND user_id = ?")->execute([$b['role'], $hid, $tid]);
    json_ok(['user_id' => $tid, 'role' => $b['role']]);
}

// ─── Invites ───────────────────────────────────────────────────────────────

function hh_invite_create(array $session, int $hid): void {
    $db = db();
    admin_required($db, $hid, $session['sub']);
    $code    = strtoupper(bin2hex(random_bytes(2))) . '-' . strtoupper(bin2hex(random_bytes(2)));
    $expires = date('Y-m-d H:i:s', strtotime('+7 days'));
    $db->prepare("INSERT INTO invites (household_id, code, created_by, expires_at) VALUES (?, ?, ?, ?)")
       ->execute([$hid, $code, $session['sub'], $expires]);
    json_ok([
        'code'       => $code,
        'expires_at' => gmdate('c', strtotime('+7 days')),
        'share_url'  => FRONTEND_ORIGIN . "/join/$code",
    ], 201);
}

function hh_invite_active(array $session, int $hid): void {
    $db = db();
    membership_required($db, $hid, $session['sub']);
    $stmt = $db->prepare("SELECT code, expires_at FROM invites WHERE household_id = ? AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1");
    $stmt->execute([$hid]);
    $row = $stmt->fetch();
    if (!$row) json_err('No active invite', 'NOT_FOUND', 404);
    json_ok([
        'code'       => $row['code'],
        'expires_at' => gmdate('c', strtotime($row['expires_at'])),
        'share_url'  => FRONTEND_ORIGIN . '/join/' . $row['code'],
    ]);
}

function invites_join(array $session): void {
    $b = body();
    require_fields($b, ['code']);
    $db = db();

    $stmt = $db->prepare("SELECT * FROM invites WHERE code = ?");
    $stmt->execute([$b['code']]);
    $inv = $stmt->fetch();
    if (!$inv) json_err('Code not found', 'CODE_NOT_FOUND', 404);
    if (strtotime($inv['expires_at']) < time()) json_err('Code expired', 'CODE_EXPIRED', 410);

    $hid = (int)$inv['household_id'];
    $chk = $db->prepare("SELECT 1 FROM household_members WHERE household_id = ? AND user_id = ?");
    $chk->execute([$hid, $session['sub']]);
    if ($chk->fetch()) json_err('Already a member', 'ALREADY_MEMBER', 409);

    $db->prepare("INSERT INTO household_members (household_id, user_id, role) VALUES (?, ?, 'member')")->execute([$hid, $session['sub']]);
    $db->prepare("UPDATE invites SET used_count = used_count + 1 WHERE id = ?")->execute([$inv['id']]);

    $stmt = $db->prepare("SELECT id, name FROM households WHERE id = ?");
    $stmt->execute([$hid]);
    $hh = $stmt->fetch();
    json_ok(['id' => (int)$hh['id'], 'name' => $hh['name'], 'role' => 'member', 'member_count' => hh_member_count($db, $hid), 'members' => hh_members($db, $hid)]);
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function hh_members(PDO $db, int $hid): array {
    $stmt = $db->prepare("
        SELECT u.id, u.display_name, u.avatar_index, hm.role
        FROM users u JOIN household_members hm ON hm.user_id = u.id
        WHERE hm.household_id = ? ORDER BY hm.joined_at ASC
    ");
    $stmt->execute([$hid]);
    return array_map(fn($r) => [
        'id' => (int)$r['id'], 'display_name' => $r['display_name'],
        'avatar_index' => (int)$r['avatar_index'], 'role' => $r['role'],
    ], $stmt->fetchAll());
}

function hh_member_count(PDO $db, int $hid): int {
    $stmt = $db->prepare("SELECT COUNT(*) as c FROM household_members WHERE household_id = ?");
    $stmt->execute([$hid]);
    return (int)$stmt->fetch()['c'];
}
