<?php
function shopping_list(array $session, int $hid): void {
    $db = db();
    membership_required($db, $hid, $session['sub']);
    $stmt = $db->prepare("
        SELECT s.*, u.display_name as ab_name, u.avatar_index as ab_av
        FROM shopping_list_items s
        JOIN users u ON u.id = s.added_by
        WHERE s.household_id = ?
        ORDER BY s.checked ASC, s.created_at DESC
    ");
    $stmt->execute([$hid]);
    json_ok(['items' => array_map('shopping_to_obj', $stmt->fetchAll())]);
}

function shopping_add(array $session, int $hid): void {
    $db = db();
    membership_required($db, $hid, $session['sub']);
    $b = body();
    require_fields($b, ['name']);

    $unit = trim($b['unit'] ?? '');

    // Dedup: same unchecked name+unit bumps quantity instead of duplicating
    $stmt = $db->prepare("SELECT id, quantity FROM shopping_list_items WHERE household_id = ? AND name = ? AND unit = ? AND checked = 0");
    $stmt->execute([$hid, trim($b['name']), $unit]);
    $existing = $stmt->fetch();
    if ($existing) {
        $newQty = (int)$existing['quantity'] + (int)($b['quantity'] ?? 1);
        $db->prepare("UPDATE shopping_list_items SET quantity = ? WHERE id = ?")->execute([$newQty, $existing['id']]);
        json_ok(shopping_fetch($db, (int)$existing['id']));
    }

    $db->prepare("
        INSERT INTO shopping_list_items (household_id, name, ean, quantity, unit, added_by)
        VALUES (?, ?, ?, ?, ?, ?)
    ")->execute([
        $hid, trim($b['name']),
        trim($b['ean'] ?? ''),
        (int)($b['quantity'] ?? 1),
        $unit,
        $session['sub'],
    ]);
    json_ok(shopping_fetch($db, (int)$db->lastInsertId()), 201);
}

function shopping_update(array $session, int $hid, int $sid): void {
    $db = db();
    membership_required($db, $hid, $session['sub']);
    $b = body();
    $sets = []; $vals = [];
    foreach (['name', 'quantity', 'unit', 'checked'] as $f) {
        if (array_key_exists($f, $b)) { $sets[] = "$f = ?"; $vals[] = $f === 'checked' ? (int)(bool)$b[$f] : $b[$f]; }
    }
    if ($sets) {
        $vals[] = $sid; $vals[] = $hid;
        $db->prepare("UPDATE shopping_list_items SET " . implode(', ', $sets) . " WHERE id = ? AND household_id = ?")->execute($vals);
    }
    json_ok(shopping_fetch($db, $sid));
}

function shopping_delete(array $session, int $hid, int $sid): void {
    $db = db();
    membership_required($db, $hid, $session['sub']);
    $db->prepare("DELETE FROM shopping_list_items WHERE id = ? AND household_id = ?")->execute([$sid, $hid]);
    http_response_code(204); exit;
}

function shopping_clear_checked(array $session, int $hid): void {
    $db = db();
    membership_required($db, $hid, $session['sub']);
    $db->prepare("DELETE FROM shopping_list_items WHERE household_id = ? AND checked = 1")->execute([$hid]);
    json_ok(['cleared' => true]);
}

function shopping_fetch(PDO $db, int $id): array {
    $stmt = $db->prepare("
        SELECT s.*, u.display_name as ab_name, u.avatar_index as ab_av
        FROM shopping_list_items s
        JOIN users u ON u.id = s.added_by
        WHERE s.id = ?
    ");
    $stmt->execute([$id]);
    return shopping_to_obj($stmt->fetch() ?: []);
}

function shopping_to_obj(array $r): array {
    if (empty($r)) return [];
    return [
        'id'         => (int)$r['id'],
        'name'       => $r['name'],
        'ean'        => $r['ean'],
        'quantity'   => (int)$r['quantity'],
        'unit'       => $r['unit'] ?? '',
        'checked'    => (bool)$r['checked'],
        'added_by'   => ['display_name' => $r['ab_name'], 'avatar_index' => (int)$r['ab_av']],
        'created_at' => gmdate('c', strtotime($r['created_at'])),
    ];
}
