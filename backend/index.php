<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/JWT.php';
require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/middleware.php';

JWT::init(JWT_SECRET);
cors();

$path   = trim($_GET['path'] ?? '', '/');
$method = $_SERVER['REQUEST_METHOD'];
$seg    = array_values(array_filter(explode('/', $path)));

if (empty($seg)) json_err('Not found', 'NOT_FOUND', 404);

switch ($seg[0]) {
    case 'auth':
        require_once __DIR__ . '/routes/auth.php';
        route_auth($seg, $method);
        break;

    case 'invites':
        require_once __DIR__ . '/routes/households.php';
        route_invites_join($method);
        break;

    case 'households':
        require_once __DIR__ . '/routes/households.php';
        require_once __DIR__ . '/routes/items.php';
        require_once __DIR__ . '/routes/notifications.php';
        route_households($seg, $method);
        break;

    case 'products':
        require_once __DIR__ . '/routes/products.php';
        route_products($seg, $method);
        break;

    case 'push':
        require_once __DIR__ . '/routes/push.php';
        route_push($seg, $method);
        break;

    default:
        json_err('Not found', 'NOT_FOUND', 404);
}
