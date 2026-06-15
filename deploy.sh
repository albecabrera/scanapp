#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Scan & Save — Deployment Script
#
# Usage:
#   ./deploy.sh                        # deploys to DEPLOY_PATH (default below)
#   DEPLOY_PATH=/var/www/html/scanapp ./deploy.sh
#   DEPLOY_PATH=/var/www/html/scanapp DRY_RUN=1 ./deploy.sh
#
# What it does:
#   1. Pull latest code from git
#   2. Install/update frontend dependencies
#   3. Build frontend with correct deploy path
#   4. Sync build artifacts to webroot
#   5. Run pending database migrations
#   6. Set correct file permissions
#   7. Reload PHP-FPM / Apache
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
DEPLOY_PATH="${DEPLOY_PATH:-/var/www/html/scanapp}"
BACKEND_SRC="$ROOT/backend"
FRONTEND_SRC="$ROOT/frontend"
MIGRATIONS_DIR="$ROOT/design_handoff_scan_and_save"
DRY_RUN="${DRY_RUN:-0}"
PHP="${PHP_BIN:-php}"
MIGRATIONS_TABLE="schema_migrations"

# ── Helpers ───────────────────────────────────────────────────────────────────

info()  { echo "[INFO]  $*"; }
warn()  { echo "[WARN]  $*" >&2; }
die()   { echo "[ERROR] $*" >&2; exit 1; }
run()   { [[ "$DRY_RUN" == "1" ]] && echo "[DRY]   $*" || eval "$@"; }

# ── Pre-flight checks ─────────────────────────────────────────────────────────

info "=== Scan & Save Deploy ==="
[[ "$DRY_RUN" == "1" ]] && warn "DRY RUN — no changes will be made"

# Verify config.php exists (backend won't work without it)
[[ -f "$BACKEND_SRC/config.php" ]] || die "Missing $BACKEND_SRC/config.php — copy from config.example.php and fill in values"

# Verify VAPID private key exists
[[ -f "$BACKEND_SRC/keys/vapid_private.pem" ]] || die "Missing VAPID private key at $BACKEND_SRC/keys/vapid_private.pem — see config.example.php for generation instructions"

# Verify node is available
command -v node >/dev/null || die "node not found — install Node.js 20+"
command -v npm  >/dev/null || die "npm not found"

info "Deploy path: $DEPLOY_PATH"
info "PHP binary:  $PHP"

# ── 1. Git pull ───────────────────────────────────────────────────────────────

info "Pulling latest code..."
run git -C "$ROOT" pull --ff-only

# ── 2. Frontend dependencies ──────────────────────────────────────────────────

info "Installing frontend dependencies..."
run npm --prefix "$FRONTEND_SRC" ci --prefer-offline

# ── 3. Build frontend ─────────────────────────────────────────────────────────

info "Building frontend → $DEPLOY_PATH ..."
run DEPLOY_PATH="$DEPLOY_PATH" npm --prefix "$FRONTEND_SRC" run build

# ── 4. Sync backend ───────────────────────────────────────────────────────────

info "Syncing backend files..."
run mkdir -p "$DEPLOY_PATH/api"
# rsync preserves permissions; exclude config.php (it's server-local)
run rsync -a --delete \
    --exclude="config.php" \
    --exclude="keys/" \
    "$BACKEND_SRC/" "$DEPLOY_PATH/api/"

# ── 5. Database migrations ────────────────────────────────────────────────────

info "Running database migrations..."
# Load DB credentials from config.php
DB_HOST=$($PHP -r "require '$BACKEND_SRC/config.php'; echo DB_HOST;")
DB_PORT=$($PHP -r "require '$BACKEND_SRC/config.php'; echo DB_PORT;")
DB_NAME=$($PHP -r "require '$BACKEND_SRC/config.php'; echo DB_NAME;")
DB_USER=$($PHP -r "require '$BACKEND_SRC/config.php'; echo DB_USER;")
DB_PASS=$($PHP -r "require '$BACKEND_SRC/config.php'; echo DB_PASS;")

MYSQL_OPTS="-h$DB_HOST -P$DB_PORT -u$DB_USER -p$DB_PASS $DB_NAME"
MYSQL="mysql $MYSQL_OPTS --batch --silent"

# Create migrations tracking table if it doesn't exist
if [[ "$DRY_RUN" != "1" ]]; then
    mysql $MYSQL_OPTS -e "
        CREATE TABLE IF NOT EXISTS \`$MIGRATIONS_TABLE\` (
            \`file\`       VARCHAR(255) PRIMARY KEY,
            \`applied_at\` DATETIME DEFAULT NOW()
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    "
fi

# Run schema.sql first (idempotent via IF NOT EXISTS)
SCHEMA_FILE="$MIGRATIONS_DIR/schema.sql"
if [[ -f "$SCHEMA_FILE" ]]; then
    if [[ "$DRY_RUN" == "1" ]]; then
        echo "[DRY]   Would apply schema: $SCHEMA_FILE"
    else
        ALREADY=$(mysql $MYSQL_OPTS --batch --silent -e "SELECT COUNT(*) FROM \`$MIGRATIONS_TABLE\` WHERE file='schema.sql';" 2>/dev/null || echo 0)
        if [[ "$ALREADY" == "0" ]]; then
            info "  Applying schema.sql..."
            mysql $MYSQL_OPTS < "$SCHEMA_FILE"
            mysql $MYSQL_OPTS -e "INSERT IGNORE INTO \`$MIGRATIONS_TABLE\` (file) VALUES ('schema.sql');"
        else
            info "  schema.sql already applied — skipping"
        fi
    fi
fi

# Apply any numbered migration files in order
shopt -s nullglob
for SQL in $(ls "$MIGRATIONS_DIR"/*.sql 2>/dev/null | grep -v schema.sql | sort); do
    FNAME="$(basename "$SQL")"
    if [[ "$DRY_RUN" == "1" ]]; then
        echo "[DRY]   Would apply: $FNAME"
    else
        APPLIED=$(mysql $MYSQL_OPTS --batch --silent -e "SELECT COUNT(*) FROM \`$MIGRATIONS_TABLE\` WHERE file='$FNAME';" 2>/dev/null || echo 0)
        if [[ "$APPLIED" == "0" ]]; then
            info "  Applying $FNAME..."
            mysql $MYSQL_OPTS < "$SQL"
            mysql $MYSQL_OPTS -e "INSERT INTO \`$MIGRATIONS_TABLE\` (file) VALUES ('$FNAME');"
        else
            info "  $FNAME already applied — skipping"
        fi
    fi
done

# ── 6. File permissions ───────────────────────────────────────────────────────

info "Setting file permissions..."
run find "$DEPLOY_PATH"       -type f -exec chmod 644 {} \;
run find "$DEPLOY_PATH"       -type d -exec chmod 755 {} \;
run chmod 600 "$DEPLOY_PATH/api/keys/vapid_private.pem" 2>/dev/null || true
# Protect config.php from web reads (Apache .htaccess already does this,
# but OS permissions add defense-in-depth)
run chmod 640 "$DEPLOY_PATH/api/config.php" 2>/dev/null || true

# ── 7. Reload server ──────────────────────────────────────────────────────────

info "Reloading server..."
if command -v php-fpm8.4 &>/dev/null; then
    run systemctl reload php8.4-fpm || warn "Could not reload php8.4-fpm (run manually)"
elif command -v php-fpm &>/dev/null; then
    run systemctl reload php-fpm || warn "Could not reload php-fpm (run manually)"
fi

if command -v nginx &>/dev/null; then
    run nginx -s reload || warn "Could not reload nginx (run: sudo nginx -s reload)"
elif command -v apachectl &>/dev/null; then
    run apachectl graceful || warn "Could not reload apache (run: sudo apachectl graceful)"
fi

# ── Done ──────────────────────────────────────────────────────────────────────

info ""
info "=== Deploy complete! ==="
info ""
info "Next: verify at https://yourdomain.com/scanapp/"
info "Health: https://yourdomain.com/scanapp/api/v1/health"
