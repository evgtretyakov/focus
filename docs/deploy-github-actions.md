# Автодеплой через GitHub Actions

После merge в `main` workflow **CI** запускает lint, тесты и build. При успехе автоматически стартует **Deploy production** — обновление VPS и проверка сайта.

## Секреты репозитория

В GitHub: **Settings → Secrets and variables → Actions → New repository secret**

| Secret | Значение |
|--------|----------|
| `DEPLOY_HOST` | IP или hostname VPS (например `79.174.90.86`) |
| `DEPLOY_USER` | SSH-пользователь (обычно `root`) |
| `DEPLOY_SSH_KEY` | Приватный ключ OpenSSH целиком, включая `BEGIN` / `END` |

Ключ должен быть добавлен в `~/.ssh/authorized_keys` на сервере.

**Все три секрета обязательны.** Если `DEPLOY_USER` пустой, deploy упадёт с `DEPLOY_HOST and DEPLOY_USER must be set`.

Через CLI (если есть права):

```bash
gh secret set DEPLOY_HOST --body "79.174.90.86"
gh secret set DEPLOY_USER --body "root"
gh secret set DEPLOY_SSH_KEY < ~/.ssh/your_deploy_key
```

## Что делает deploy

1. `git pull origin main` в `/opt/focus`
2. `docker compose -f docker-compose.prod-nginx.yml up -d --build`
3. Применение последней SQL-миграции (идемпотентно, ошибки игнорируются)
4. Проверка: commit на сервере = commit в `main`, `https://focus.etretyakov.ru/login` отвечает 200

## Ручной запуск

**Actions → Deploy production → Run workflow**

## Локальный деплой (как раньше)

```bash
export DEPLOY_HOST=...
export DEPLOY_USER=root
export DEPLOY_SSH_KEY="..."
bash scripts/deploy-remote.sh
```
