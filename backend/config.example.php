<?php
// Copy to config.php and adjust. config.php is gitignored.
define('DB_HOST', 'mariadb');          // Docker service name; '127.0.0.1' outside Docker
define('DB_PORT', 3306);
define('DB_NAME', 'scanapp');
define('DB_USER', 'root');
define('DB_PASS', '');
define('JWT_SECRET', 'change-me');
define('APP_BASE', '/scanapp');
define('FRONTEND_ORIGIN', 'http://localhost:5173');

// Web Push (VAPID). Generate keys:
//   openssl ecparam -genkey -name prime256v1 -noout -out keys/vapid_private.pem
//   Public key = base64url of the uncompressed P-256 point (65 bytes):
//   openssl ec -in keys/vapid_private.pem -text -noout | sed -n '/pub:/,/ASN1/p' \
//     | grep -v 'pub:\|ASN1' | tr -d ' \n:' | xxd -r -p | base64 | tr '+/' '-_' | tr -d '='
define('VAPID_PUBLIC_KEY', 'your-base64url-public-key');
define('VAPID_PRIVATE_PEM', __DIR__ . '/keys/vapid_private.pem');
define('VAPID_SUBJECT', 'mailto:you@example.com');
