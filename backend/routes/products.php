<?php
function route_products(array $seg, string $method): void {
    auth_required();
    if (!isset($seg[1])) json_err('EAN required', 'VALIDATION_ERROR', 422);
    if ($method !== 'GET') json_err('Method not allowed', 'METHOD_NOT_ALLOWED', 405);
    products_lookup($seg[1]);
}

function products_lookup(string $ean): void {
    $db = db();
    $stmt = $db->prepare("SELECT * FROM products WHERE ean = ? AND fetched_at > DATE_SUB(NOW(), INTERVAL 30 DAY)");
    $stmt->execute([$ean]);
    $cached = $stmt->fetch();
    if ($cached) {
        json_ok(['ean' => $cached['ean'], 'name' => $cached['name'], 'brand' => $cached['brand'], 'image_url' => $cached['image_url'], 'cached' => true]);
    }

    $url = "https://world.openfoodfacts.org/api/v2/product/$ean.json";
    $ctx = stream_context_create(['http' => [
        'timeout'    => 10,
        'user_agent' => 'ScanAndSave/1.0 (local dev)',
        'header'     => "Accept: application/json\r\n",
    ]]);
    $raw = @file_get_contents($url, false, $ctx);
    if ($raw === false) json_err('Product not found', 'PRODUCT_NOT_FOUND', 404);

    $data = json_decode($raw, true);
    if (($data['status'] ?? 0) !== 1) json_err('Product not found', 'PRODUCT_NOT_FOUND', 404);

    $p     = $data['product'];
    $name  = $p['product_name'] ?? $p['product_name_en'] ?? $p['product_name_de'] ?? '';
    $brand = $p['brands'] ?? '';
    $img   = $p['image_front_url'] ?? $p['image_url'] ?? '';
    if (!$name) json_err('Product not found', 'PRODUCT_NOT_FOUND', 404);

    $db->prepare("
        INSERT INTO products (ean, name, brand, image_url, raw_json, fetched_at)
        VALUES (?, ?, ?, ?, ?, NOW())
        ON DUPLICATE KEY UPDATE name = VALUES(name), brand = VALUES(brand), image_url = VALUES(image_url), raw_json = VALUES(raw_json), fetched_at = NOW()
    ")->execute([$ean, $name, $brand, $img, $raw]);

    json_ok(['ean' => $ean, 'name' => $name, 'brand' => $brand, 'image_url' => $img, 'cached' => false]);
}
