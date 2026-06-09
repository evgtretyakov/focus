#!/usr/bin/env bash
set -euo pipefail

# Deploy Focus to production VPS (nginx + docker compose).
# Requires: DEPLOY_HOST, DEPLOY_USER, DEPLOY_SSH_KEY in environment.

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SSH_KEY="${DEPLOY_SSH_KEY_FILE:-$HOME/.ssh/deploy_key}"
REMOTE_DIR="/opt/focus"
COMPOSE_FILE="docker-compose.prod-nginx.yml"

if [[ -z "${DEPLOY_HOST:-}" || -z "${DEPLOY_USER:-}" ]]; then
  echo "DEPLOY_HOST and DEPLOY_USER must be set" >&2
  exit 1
fi

if [[ ! -f "$SSH_KEY" ]]; then
  python3 - <<'PY'
import os, re, textwrap
key = os.environ['DEPLOY_SSH_KEY'].strip()
m = re.search(r'-----BEGIN OPENSSH PRIVATE KEY-----\s*(.+?)\s*-----END OPENSSH PRIVATE KEY-----', key, re.DOTALL)
if not m:
    raise SystemExit('Invalid DEPLOY_SSH_KEY format')
body = m.group(1).replace(' ', '').replace('\n', '')
wrapped = '\n'.join(textwrap.wrap(body, 70))
path = os.path.expanduser('~/.ssh/deploy_key')
os.makedirs(os.path.dirname(path), exist_ok=True)
with open(path, 'w') as f:
    f.write(f"-----BEGIN OPENSSH PRIVATE KEY-----\n{wrapped}\n-----END OPENSSH PRIVATE KEY-----\n")
os.chmod(path, 0o600)
PY
  SSH_KEY="$HOME/.ssh/deploy_key"
fi

SSH=(ssh -i "$SSH_KEY" -o StrictHostKeyChecking=accept-new "${DEPLOY_USER}@${DEPLOY_HOST}")

echo "==> Updating ${REMOTE_DIR} on ${DEPLOY_HOST}"
"${SSH[@]}" "bash -s" <<REMOTE
set -euo pipefail
if [[ ! -d ${REMOTE_DIR}/.git ]]; then
  git clone https://github.com/evgtretyakov/focus.git ${REMOTE_DIR}
fi
cd ${REMOTE_DIR}
git pull origin main

if [[ ! -f .env ]]; then
  DB_PASSWORD=\$(openssl rand -base64 24 | tr -d '/+=' | head -c 32)
  SESSION_SECRET=\$(openssl rand -base64 32)
  OWNER_PASSWORD=\$(openssl rand -base64 18 | tr -d '/+=' | head -c 20)
  OWNER_HASH=\$(cd ${REMOTE_DIR} && npm run hash-password -- "\$OWNER_PASSWORD" | tail -1)
  python3 - <<PY
hash_val = """\${OWNER_HASH}""".replace('\$', '\$\$')
open('.env','w').write(f"DB_PASSWORD=\${DB_PASSWORD}\nSESSION_SECRET=\${SESSION_SECRET}\nOWNER_PASSWORD_HASH={hash_val}\n")
PY
  echo "\$OWNER_PASSWORD" > .owner-password
  chmod 600 .env .owner-password
  echo "Created .env and .owner-password on server"
fi

docker compose -f ${COMPOSE_FILE} up -d --build

LATEST=\$(ls -1 prisma/migrations | grep -E '^[0-9]' | sort | tail -1)
docker compose -f ${COMPOSE_FILE} exec -T db psql -U focus -d focus \
  < "prisma/migrations/\${LATEST}/migration.sql" 2>/dev/null || true

if [[ ! -f /etc/nginx/sites-available/focus.etretyakov.ru ]]; then
  cp deploy/nginx/focus.etretyakov.ru /etc/nginx/sites-available/focus.etretyakov.ru
  ln -sf /etc/nginx/sites-available/focus.etretyakov.ru /etc/nginx/sites-enabled/
  nginx -t && systemctl reload nginx
  certbot --nginx -d focus.etretyakov.ru --non-interactive --agree-tos --register-unsafely-without-email
fi

mkdir -p ${REMOTE_DIR}/backups
git rev-parse HEAD
REMOTE

echo "==> Done. https://focus.etretyakov.ru/login"
