<?php
function items_list(array $session, int $hid): void {
    $db = db();
    membership_required($db, $hid, $session['sub']);

    $where  = ['i.household_id = ?'];
    $params = [$hid];

    if (!empty($_GET['location'])) {
        $where[]  = 'i.location = ?';
        $params[] = $_GET['location'];
    }
    if (!empty($_GET['expires_within'])) {
        $where[]  = 'i.expires_at IS NOT NULL AND DATEDIFF(i.expires_at, CURDATE()) <= ? AND DATEDIFF(i.expires_at, CURDATE()) >= 0';
        $params[] = (int)$_GET['expires_within'];
    }

    $sort = match ($_GET['sort'] ?? '') {
        'added_at' => 'i.added_at DESC',
        default    => 'i.expires_at IS NULL ASC, i.expires_at ASC',
    };

    $w    = implode(' AND ', $where);
    $stmt = $db->prepare("
        SELECT i.*,
               a.id as ab_id, a.display_name as ab_name, a.avatar_index as ab_av,
               s.id as as_id, s.display_name as as_name, s.avatar_index as as_av
        FROM inventory_items i
        JOIN  users a ON a.id = i.added_by
        LEFT JOIN users s ON s.id = i.assigned_to
        WHERE $w ORDER BY $sort
    ");
    $stmt->execute($params);
    json_ok(['items' => array_map('item_to_obj', $stmt->fetchAll())]);
}

function item_create(array $session, int $hid): void {
    $db = db();
    membership_required($db, $hid, $session['sub']);
    $b = body();
    require_fields($b, ['name']);

    $ean   = trim($b['ean'] ?? '');
    $tile  = $ean !== '' ? (abs(crc32($ean)) % 6) : random_int(0, 5);

    // Fetch brand/image from products cache if EAN provided
    $brand = '';
    $img   = '';
    if ($ean !== '') {
        $ps = $db->prepare("SELECT name, brand, image_url FROM products WHERE ean = ?");
        $ps->execute([$ean]);
        $pd = $ps->fetch();
        if ($pd) { $brand = $pd['brand']; $img = $pd['image_url']; }
    }

    $db->prepare("
        INSERT INTO inventory_items (household_id, ean, name, location, expires_at, quantity, tile_index, added_by, assigned_to)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ")->execute([
        $hid, $ean, $b['name'],
        $b['location']    ?? 'fridge',
        $b['expires_at']  ?? null,
        $b['quantity']    ?? 1,
        $tile,
        $session['sub'],
        $b['assigned_to'] ?? null,
    ]);
    $id = (int)$db->lastInsertId();

    $item = fetch_item($db, $id);
    $item['brand']     = $brand;
    $item['image_url'] = $img;
    json_ok($item, 201);
}

function item_update(array $session, int $hid, int $iid): void {
    $db = db();
    membership_required($db, $hid, $session['sub']);
    $b    = body();
    $sets = []; $vals = [];
    foreach (['name', 'location', 'expires_at', 'quantity', 'assigned_to'] as $f) {
        if (array_key_exists($f, $b)) { $sets[] = "$f = ?"; $vals[] = $b[$f]; }
    }
    if ($sets) {
        $vals[] = $iid; $vals[] = $hid;
        $db->prepare("UPDATE inventory_items SET " . implode(', ', $sets) . " WHERE id = ? AND household_id = ?")->execute($vals);
    }
    json_ok(fetch_item($db, $iid));
}

function item_consume(array $session, int $hid, int $iid): void {
    $db = db();
    membership_required($db, $hid, $session['sub']);
    $stmt = $db->prepare("SELECT quantity FROM inventory_items WHERE id = ? AND household_id = ?");
    $stmt->execute([$iid, $hid]);
    $row = $stmt->fetch();
    if (!$row) json_err('Item not found', 'NOT_FOUND', 404);

    $newQty = (int)$row['quantity'] - 1;
    if ($newQty <= 0) {
        $db->prepare("DELETE FROM inventory_items WHERE id = ?")->execute([$iid]);
        json_ok(['id' => $iid, 'quantity' => 0, 'deleted' => true]);
    } else {
        $db->prepare("UPDATE inventory_items SET quantity = ? WHERE id = ?")->execute([$newQty, $iid]);
        json_ok(['id' => $iid, 'quantity' => $newQty, 'deleted' => false]);
    }
}

function item_delete(array $session, int $hid, int $iid): void {
    $db = db();
    membership_required($db, $hid, $session['sub']);
    $db->prepare("DELETE FROM inventory_items WHERE id = ? AND household_id = ?")->execute([$iid, $hid]);
    http_response_code(204); exit;
}

function fetch_item(PDO $db, int $id): array {
    $stmt = $db->prepare("
        SELECT i.*,
               a.id as ab_id, a.display_name as ab_name, a.avatar_index as ab_av,
               s.id as as_id, s.display_name as as_name, s.avatar_index as as_av
        FROM inventory_items i
        JOIN  users a ON a.id = i.added_by
        LEFT JOIN users s ON s.id = i.assigned_to
        WHERE i.id = ?
    ");
    $stmt->execute([$id]);
    return item_to_obj($stmt->fetch() ?: []);
}

function item_to_obj(array $r): array {
    if (empty($r)) return [];
    return [
        'id'          => (int)$r['id'],
        'ean'         => $r['ean'],
        'name'        => $r['name'],
        'brand'       => '',
        'image_url'   => '',
        'location'    => $r['location'],
        'expires_at'  => $r['expires_at'],
        'quantity'    => (int)$r['quantity'],
        'tile_index'  => (int)$r['tile_index'],
        'added_by'    => ['id' => (int)$r['ab_id'], 'display_name' => $r['ab_name'], 'avatar_index' => (int)$r['ab_av']],
        'assigned_to' => isset($r['as_id']) && $r['as_id']
            ? ['id' => (int)$r['as_id'], 'display_name' => $r['as_name'], 'avatar_index' => (int)$r['as_av']]
            : null,
        'added_at'    => gmdate('c', strtotime($r['added_at'])),
    ];
}
