<?php
function stats_get(array $session, int $hid): void {
    $db = db();
    membership_required($db, $hid, $session['sub']);

    // Current month totals by action
    $stmt = $db->prepare("
        SELECT action, SUM(quantity) as total
        FROM activity_log
        WHERE household_id = ? AND created_at >= DATE_FORMAT(NOW(), '%Y-%m-01')
        GROUP BY action
    ");
    $stmt->execute([$hid]);
    $month = ['added' => 0, 'consumed' => 0, 'wasted' => 0, 'removed' => 0];
    foreach ($stmt->fetchAll() as $r) $month[$r['action']] = (int)$r['total'];

    // Last 6 months: consumed vs wasted
    $stmt = $db->prepare("
        SELECT DATE_FORMAT(created_at, '%Y-%m') as ym, action, SUM(quantity) as total
        FROM activity_log
        WHERE household_id = ? AND action IN ('consumed','wasted')
          AND created_at >= DATE_SUB(DATE_FORMAT(NOW(), '%Y-%m-01'), INTERVAL 5 MONTH)
        GROUP BY ym, action
        ORDER BY ym ASC
    ");
    $stmt->execute([$hid]);
    $byMonth = [];
    foreach ($stmt->fetchAll() as $r) {
        $byMonth[$r['ym']] ??= ['month' => $r['ym'], 'consumed' => 0, 'wasted' => 0];
        $byMonth[$r['ym']][$r['action']] = (int)$r['total'];
    }

    // Recent activity feed (shared-kitchen log)
    $stmt = $db->prepare("
        SELECT a.item_name, a.action, a.quantity, a.created_at,
               u.display_name, u.avatar_index
        FROM activity_log a
        JOIN users u ON u.id = a.user_id
        WHERE a.household_id = ?
        ORDER BY a.created_at DESC
        LIMIT 25
    ");
    $stmt->execute([$hid]);
    $activity = array_map(fn($r) => [
        'item_name'    => $r['item_name'],
        'action'       => $r['action'],
        'quantity'     => (int)$r['quantity'],
        'user'         => ['display_name' => $r['display_name'], 'avatar_index' => (int)$r['avatar_index']],
        'created_at'   => gmdate('c', strtotime($r['created_at'])),
    ], $stmt->fetchAll());

    json_ok([
        'month'    => $month,
        'months'   => array_values($byMonth),
        'activity' => $activity,
    ]);
}

function log_activity(PDO $db, int $hid, int $uid, string $itemName, string $action, int $qty = 1): void {
    try {
        $db->prepare("
            INSERT INTO activity_log (household_id, user_id, item_name, action, quantity)
            VALUES (?, ?, ?, ?, ?)
        ")->execute([$hid, $uid, $itemName, $action, $qty]);
    } catch (Exception $e) { /* logging must never break the main operation */ }
}
