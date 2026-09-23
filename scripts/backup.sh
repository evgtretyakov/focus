#!/usr/bin/env bash
set -euo pipefail

# Daily pg_dump of production DB. Run from cron on the VPS.
# Writes to a temp file first so a failed or empty dump never replaces a good one.

REMOTE_DIR="${REMOTE_DIR:-/opt/focus}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod-nginx.yml}"
BACKUP_DIR="${REMOTE_DIR}/backups"
TARGET="${BACKUP_DIR}/focus-$(date +%Y%m%d).sql"
TMP="${TARGET}.tmp"

mkdir -p "$BACKUP_DIR"
trap 'rm -f "$TMP"' EXIT

cd "$REMOTE_DIR"
if ! docker compose -f "$COMPOSE_FILE" exec -T db pg_dump -U focus focus > "$TMP"; then
  echo "$(date -Is) ERROR: pg_dump failed" >&2
  exit 1
fi

if [[ ! -s "$TMP" ]] || ! tail -n 20 "$TMP" | grep -q 'PostgreSQL database dump complete'; then
  echo "$(date -Is) ERROR: dump is empty or incomplete" >&2
  exit 1
fi

mv "$TMP" "$TARGET"
echo "$(date -Is) OK: $TARGET ($(stat -c %s "$TARGET") bytes)"

USED_PCT=$(df --output=pcent / | tail -1 | tr -dc '0-9')
if (( USED_PCT >= 90 )); then
  echo "$(date -Is) WARNING: disk usage ${USED_PCT}%" >&2
fi
