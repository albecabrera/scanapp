<?php
// ─────────────────────────────────────────────────────────────────────────────
// Copy this file to config.php and fill in real values.
// config.php is git-ignored — never commit secrets.
// ─────────────────────────────────────────────────────────────────────────────

// ── Database ──────────────────────────────────────────────────────────────────
// Dev (Docker):   DB_HOST = 'mariadb'  (service name in docker-compose.yml)
// Prod (VPS):     DB_HOST = '127.0.0.1' (local socket or remote host)
define('DB_HOST', 'mariadb');
define('DB_PORT', 3306);
define('DB_NAME', 'scanapp');
define('DB_USER', 'scanapp_user');   // DO NOT use root in production
define('DB_PASS', 'change-me');

// ── JWT ───────────────────────────────────────────────────────────────────────
// Generate with: openssl rand -base64 48
define('JWT_SECRET', 'change-me-use-openssl-rand-base64-48');

// ── App base path ─────────────────────────────────────────────────────────────
// Root domain:      define('APP_BASE', '');
// Subdirectory:     define('APP_BASE', '/scanapp');   ← default
define('APP_BASE', '/scanapp');

// ── Environment ───────────────────────────────────────────────────────────────
// 'development' enables debug output in /health endpoint
define('APP_ENV', 'development');

// ── CORS ──────────────────────────────────────────────────────────────────────
// Primary origin for CORS. Dev: localhost:5174, Prod: https://yourdomain.com
define('FRONTEND_ORIGIN', 'http://localhost:5174');
// Secondary origin allowed in dev (e.g. XAMPP local build). Leave empty in prod.
define('CORS_DEV_ORIGIN', 'http://localhost/scanapp');

// ── Web Push (VAPID) ──────────────────────────────────────────────────────────
// Generate private key:
//   mkdir -p keys
//   openssl ecparam -genkey -name prime256v1 -noout -out keys/vapid_private.pem
//   chmod 600 keys/vapid_private.pem
//
// Derive public key (base64url of uncompressed P-256 point, 65 bytes):
//   openssl ec -in keys/vapid_private.pem -text -noout \
//     | sed -n '/pub:/,/ASN1 OID/p' | grep -v 'pub:\|ASN1 OID' \
//     | tr -d ' \n:' | xxd -r -p | base64 | tr '+/' '-_' | tr -d '='
//
// Or use the helper: php backend/cron/gen_vapid.php
define('VAPID_PUBLIC_KEY', 'your-base64url-vapid-public-key');
define('VAPID_PRIVATE_PEM', __DIR__ . '/keys/vapid_private.pem');
define('VAPID_SUBJECT', 'mailto:admin@yourdomain.com');
