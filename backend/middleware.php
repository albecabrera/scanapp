<?php
function auth_required(): array {
    $h = $_SERVER['HTTP_AUTHORIZATION']
        ?? getallheaders()['Authorization']
        ?? getallheaders()['authorization']
        ?? '';
    if (!preg_match('/Bearer\s+(.+)/i', $h, $m)) {
        json_err('Unauthenticated', 'UNAUTHENTICATED', 401);
    }
    $payload = JWT::decode($m[1]);
    if (!$payload) {
        json_err('Invalid or expired token', 'INVALID_TOKEN', 401);
    }
    return $payload;
}

function membership_required(PDO $db, int $householdId, int $userId): array {
    $stmt = $db->prepare("SELECT role FROM household_members WHERE household_id = ? AND user_id = ?");
    $stmt->execute([$householdId, $userId]);
    $row = $stmt->fetch();
    if (!$row) json_err('Not a member of this household', 'FORBIDDEN', 403);
    return $row;
}

function admin_required(PDO $db, int $householdId, int $userId): void {
    $member = membership_required($db, $householdId, $userId);
    if ($member['role'] !== 'admin') json_err('Admin required', 'FORBIDDEN', 403);
}
