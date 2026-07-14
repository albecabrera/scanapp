<?php
/**
 * Daily expiry notification cron.
 *
 * Finds inventory items hitting a notification threshold today and sends
 * Web Push to the relevant users (item adder by default; everyone when
 * warn_all_tomorrow is on and the item expires tomorrow). Honors per-user
 * overrides (muted, custom thresholds). Dead subscriptions are pruned.
 *
 * Run daily, e.g. host crontab:
 *   0 9 * * * docker exec xampp-php php /var/www/html/scanapp/api/cron/notify_expiring.php
 */
if (PHP_SAPI !== 'cli') { http_response_code(403); exit('CLI only'); }

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../WebPush.php';

$db = db();

// Items expiring within 7 days, joined with household members + settings + overrides
$rows = $db->query("
    SELECT i.id, i.name, i.household_id, i.added_by,
           DATEDIFF(i.expires_at, CURDATE()) AS days_left,
           hm.user_id,
           u.lang,
           COALESCE(ns.threshold_days, '3')  AS hh_thresholds,
           COALESCE(ns.warn_all_tomorrow, 0) AS warn_all,
           no2.muted,
           no2.threshold_days AS user_thresholds
    FROM inventory_items i
    JOIN household_members hm ON hm.household_id = i.household_id
    JOIN users u              ON u.id = hm.user_id
    LEFT JOIN notification_settings  ns  ON ns.household_id = i.household_id
    LEFT JOIN notification_overrides no2 ON no2.household_id = i.household_id AND no2.user_id = hm.user_id
    WHERE i.expires_at IS NOT NULL
      AND DATEDIFF(i.expires_at, CURDATE()) BETWEEN 0 AND 7
")->fetchAll();

$texts = [
    'de' => ['title' => '⚠️ Läuft bald ab', 'today' => 'läuft HEUTE ab', 'tomorrow' => 'läuft morgen ab', 'days' => 'läuft in %d Tagen ab'],
    'es' => ['title' => '⚠️ Vence pronto',  'today' => 'vence HOY',       'tomorrow' => 'vence mañana',     'days' => 'vence en %d días'],
    'en' => ['title' => '⚠️ Expiring soon', 'today' => 'expires TODAY',   'tomorrow' => 'expires tomorrow', 'days' => 'expires in %d days'],
];

// Group: user_id => list of item lines (deduped by item)
$perUser = [];
foreach ($rows as $r) {
    if ((int)($r['muted'] ?? 0) === 1) continue;

    $days       = (int)$r['days_left'];
    $thresholds = array_map('intval', explode(',', $r['user_thresholds'] ?: $r['hh_thresholds']));
    $warnAll    = (int)$r['warn_all'] === 1 && $days <= 1;

    // Shared kitchen: every member is notified on their threshold day (or day 0).
    // warn_all_tomorrow stays as the critical escalation for day ≤ 1.
    $hit = in_array($days, $thresholds, true) || $days === 0;
    if (!($warnAll || $hit)) continue;

    $t    = $texts[$r['lang']] ?? $texts['de'];
    $when = $days === 0 ? $t['today'] : ($days === 1 ? $t['tomorrow'] : sprintf($t['days'], $days));
    $perUser[$r['user_id']]['lang'] = $r['lang'];
    $perUser[$r['user_id']]['items'][$r['id']] = "{$r['name']} {$when}";
}

$sent = 0; $pruned = 0;
foreach ($perUser as $uid => $data) {
    $lines = array_values($data['items']);
    $t     = $texts[$data['lang']] ?? $texts['de'];
    $body  = implode("\n", array_slice($lines, 0, 4)) . (count($lines) > 4 ? "\n+" . (count($lines) - 4) : '');
    $payload = json_encode([
        'title' => $t['title'],
        'body'  => $body,
        'tag'   => 'ss-expiry',
        'url'   => '/',
    ], JSON_UNESCAPED_UNICODE);

    $subs = $db->prepare("SELECT id, endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = ?");
    $subs->execute([$uid]);
    foreach ($subs->fetchAll() as $sub) {
        $code = WebPush::send($sub, $payload);
        if ($code >= 200 && $code < 300) {
            $sent++;
        } elseif ($code === 404 || $code === 410) {
            $db->prepare("DELETE FROM push_subscriptions WHERE id = ?")->execute([$sub['id']]);
            $pruned++;
        }
    }
}

echo sprintf("[%s] users=%d sent=%d pruned=%d\n", date('c'), count($perUser), $sent, $pruned);
