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
        json_ok([
            'ean'        => $cached['ean'],
            'name'       => $cached['name'],
            'brand'      => $cached['brand'],
            'image_url'  => $cached['image_url'],
            'categories' => off_categories(json_decode($cached['raw_json'] ?? 'null', true)['product'] ?? null),
            'cached'     => true,
        ]);
    }

    $url = "https://world.openfoodfacts.org/api/v2/product/$ean.json";
    $ch  = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 10,
        CURLOPT_USERAGENT      => 'ScanAndSave/1.0 (local dev)',
        CURLOPT_HTTPHEADER     => ['Accept: application/json'],
        CURLOPT_FOLLOWLOCATION => true,
    ]);
    $raw  = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    if ($raw === false || $code !== 200) json_err('Product not found', 'PRODUCT_NOT_FOUND', 404);

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

    json_ok([
        'ean'        => $ean,
        'name'       => $name,
        'brand'      => $brand,
        'image_url'  => $img,
        'categories' => off_categories($p),
        'cached'     => false,
    ]);
}

/**
 * Normalize Open Food Facts category tags into a flat lowercase list.
 * Used client-side as a fallback for shelf-life expiry suggestions.
 */
function off_categories(?array $product): array {
    if (!$product) return [];
    $tags = $product['categories_tags'] ?? [];
    if (!is_array($tags)) return [];
    // Tags look like "en:dairies", "en:yogurts" — strip the lang prefix.
    return array_values(array_filter(array_map(function ($t) {
        $t = strtolower((string)$t);
        $pos = strpos($t, ':');
        return $pos !== false ? substr($t, $pos + 1) : $t;
    }, $tags)));
}
