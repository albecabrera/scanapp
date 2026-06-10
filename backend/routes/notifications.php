<?php
function notif_get(array $session, int $hid): void {
    $db = db();
    membership_required($db, $hid, $session['sub']);

    $stmt = $db->prepare("SELECT threshold_days, warn_all_tomorrow FROM notification_settings WHERE household_id = ?");
    $stmt->execute([$hid]);
    $ns = $stmt->fetch();

    $stmt2 = $db->prepare("SELECT muted, threshold_days FROM notification_overrides WHERE household_id = ? AND user_id = ?");
    $stmt2->execute([$hid, $session['sub']]);
    $ov = $stmt2->fetch();

    $thresholds = $ns ? array_values(array_filter(explode(',', $ns['threshold_days']))) : ['3'];

    json_ok([
        'threshold_days'    => $thresholds,
        'warn_all_tomorrow' => $ns ? (bool)$ns['warn_all_tomorrow'] : false,
        'my_override'       => [
            'muted'          => $ov ? (bool)$ov['muted'] : false,
            'threshold_days' => $ov && $ov['threshold_days']
                ? array_values(array_filter(explode(',', $ov['threshold_days'])))
                : null,
        ],
    ]);
}

function notif_update(array $session, int $hid): void {
    $db = db();
    admin_required($db, $hid, $session['sub']);
    $b   = body();
    $thr = implode(',', array_intersect($b['threshold_days'] ?? ['3'], ['1', '3', '7']));
    $all = isset($b['warn_all_tomorrow']) ? (int)(bool)$b['warn_all_tomorrow'] : 0;

    $db->prepare("
        INSERT INTO notification_settings (household_id, threshold_days, warn_all_tomorrow)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE threshold_days = VALUES(threshold_days), warn_all_tomorrow = VALUES(warn_all_tomorrow)
    ")->execute([$hid, $thr, $all]);

    notif_get($session, $hid);
}

function notif_update_me(array $session, int $hid): void {
    $db = db();
    membership_required($db, $hid, $session['sub']);
    $b   = body();
    $mut = isset($b['muted']) ? (int)(bool)$b['muted'] : 0;
    $thr = (isset($b['threshold_days']) && $b['threshold_days'] !== null)
        ? implode(',', array_intersect((array)$b['threshold_days'], ['1', '3', '7']))
        : null;

    $db->prepare("
        INSERT INTO notification_overrides (household_id, user_id, muted, threshold_days)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE muted = VALUES(muted), threshold_days = VALUES(threshold_days)
    ")->execute([$hid, $session['sub'], $mut, $thr]);

    json_ok(['muted' => (bool)$mut, 'threshold_days' => $thr ? explode(',', $thr) : null]);
}
