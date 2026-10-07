#!/usr/bin/env bash
#
# Apply the SQL migrations in deploy/sql/ that have not run yet, in filename
# order, recording each in a `schema_migrations` ledger so it runs once. Every
# migration here is written idempotent, so a re-run (lost ledger, edited file)
# is a safe no-op anyway.
#
# WHY THIS EXISTS: the production deploy ships code but used to skip migrations,
# so each new column 500'd until someone ran the SQL by hand (e.g. the missing
# notifications.isRead / id_person columns). Call this from the deploy script,
# after the code is in place and before the app restart:
#
#     bash <repo>/omkoora-backend--main/deploy/apply-migrations.sh
#
# DB CONNECTION, in priority order:
#   1) MYSQL_DEFAULTS_FILE=/path/to/my.cnf  (a [client] section with the creds)
#      + DB_NAME, or DB_PRO_DATABASE/DB_DEV_DATABASE read from .env.
#   2) Parsed from the backend .env next to this script's parent: DB_PRO_* when
#      NODE_ENV=production, else DB_DEV_* (host defaults to 127.0.0.1).
# The password is written to a mode-600 temp defaults file, never passed on the
# command line (so it never shows in `ps`).
#
# Exit non-zero on any failure so the deploy halts instead of restarting onto a
# half-migrated schema.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
SQL_DIR="$SCRIPT_DIR/sql"

log()  { printf '[migrate] %s\n' "$*"; }
fail() { printf '[migrate] ERROR: %s\n' "$*" >&2; exit 1; }

[ -d "$SQL_DIR" ] || fail "sql dir not found: $SQL_DIR"

ENV_FILE="${ENV_FILE:-$BACKEND_DIR/.env}"

# Read KEY from .env (last wins), stripping surrounding quotes.
getenv() {
    [ -f "$ENV_FILE" ] || return 0
    sed -n -E "s/^$1=(.*)$/\1/p" "$ENV_FILE" | tail -n1 | sed -E 's/^"(.*)"$/\1/; s/^'"'"'(.*)'"'"'$/\1/'
}

CLEANUP_FILE=""
cleanup() { [ -n "$CLEANUP_FILE" ] && rm -f "$CLEANUP_FILE"; }
trap cleanup EXIT

if [ -n "${MYSQL_DEFAULTS_FILE:-}" ]; then
    DEFAULTS_FILE="$MYSQL_DEFAULTS_FILE"
    [ -f "$DEFAULTS_FILE" ] || fail "MYSQL_DEFAULTS_FILE not found: $DEFAULTS_FILE"
    DB_NAME="${DB_NAME:-$(getenv DB_PRO_DATABASE)}"
    [ -n "$DB_NAME" ] || DB_NAME="$(getenv DB_DEV_DATABASE)"
else
    [ -f "$ENV_FILE" ] || fail "no MYSQL_DEFAULTS_FILE set and no .env at $ENV_FILE"
    NODE_ENV="${NODE_ENV:-$(getenv NODE_ENV)}"
    if [ "${NODE_ENV:-}" = "production" ]; then
        DB_USER="$(getenv DB_PRO_USERNAME)"; DB_PASS="$(getenv DB_PRO_PASSWORD)"
        DB_NAME="$(getenv DB_PRO_DATABASE)"; DB_HOST="$(getenv DB_PRO_HOST)"
    else
        DB_USER="$(getenv DB_DEV_USERNAME)"; DB_PASS="$(getenv DB_DEV_PASSWORD)"
        DB_NAME="$(getenv DB_DEV_DATABASE)"; DB_HOST="localhost"
    fi
    [ -n "${DB_USER:-}" ] || fail "DB user not found in $ENV_FILE"
    [ -n "${DB_NAME:-}" ] || fail "DB name not found in $ENV_FILE"
    [ -n "${DB_HOST:-}" ] || DB_HOST="127.0.0.1"
    DEFAULTS_FILE="$(mktemp)"; CLEANUP_FILE="$DEFAULTS_FILE"; chmod 600 "$DEFAULTS_FILE"
    {
        echo "[client]"
        echo "user=$DB_USER"
        echo "password=$DB_PASS"
        echo "host=$DB_HOST"
    } > "$DEFAULTS_FILE"
fi

[ -n "${DB_NAME:-}" ] || fail "could not determine the database name"

mysql_run() { mysql --defaults-extra-file="$DEFAULTS_FILE" "$DB_NAME" "$@"; }

mysql_run -e "SELECT 1" >/dev/null 2>&1 || fail "cannot connect to database '$DB_NAME'"

mysql_run -e "CREATE TABLE IF NOT EXISTS schema_migrations (
  filename   VARCHAR(255) NOT NULL PRIMARY KEY,
  applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;"

applied=0; skipped=0; files=0
for f in "$SQL_DIR"/*.sql; do
    [ -e "$f" ] || continue   # nullglob-free guard for an empty dir
    files=$((files + 1))
    name="$(basename "$f")"
    done_already="$(mysql_run -N -e "SELECT COUNT(*) FROM schema_migrations WHERE filename='$name'")"
    if [ "$done_already" != "0" ]; then
        skipped=$((skipped + 1)); continue
    fi
    log "applying $name"
    # Discard stdout (idempotent guards emit harmless "SELECT 1" rows); errors
    # still go to stderr and fail the command.
    mysql_run < "$f" >/dev/null || fail "migration failed: $name (not recorded — fix and re-run)"
    mysql_run -e "INSERT INTO schema_migrations (filename) VALUES ('$name')"
    applied=$((applied + 1))
done

log "done: $applied applied, $skipped already present, $files total in $SQL_DIR"
