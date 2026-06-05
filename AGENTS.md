# AGENTS.md — правила работы с репозиторием

Инструкции для AI-агентов и разработчиков проекта **Focus**.

## Git workflow

**Всегда** следуй этому процессу. Прямой push в `main` запрещён.

### Когда задача считается выполненной

Задача **не завершена**, пока код не оказался в `main`. Создание PR, зелёные тесты и отчёт пользователю — промежуточные шаги, не финал.

**Перед завершением сессии обязательно:**

1. `npm run build` (и `npm test` / `npm run lint`, если менялся код)
2. PR переведён из draft в ready (если был draft)
3. PR **смержен** в `main` (`gh pr merge` или GitHub UI)
4. Feature-ветка удалена на remote (если больше не нужна)
5. Нет незакоммиченных изменений
6. **Production обновлён:** после merge в `main` жди успешного workflow **Deploy production** (GitHub Actions) или запусти `bash scripts/deploy-remote.sh`. Проверь: commit на сервере = `main`, `curl -fsS https://focus.etretyakov.ru/login` → 200

Исключение: пользователь явно просит оставить PR открытым, или merge заблокирован (падающий CI, конфликт, нет прав) — тогда напиши причину и что осталось сделать.

> **Частая ошибка агента:** остановиться на «создал draft PR, тесты прошли». Draft PR нельзя считать доставкой — его нужно довести до merge в `main`.

### 1. Ветка

- Создавай feature-ветку от `main`:
  ```bash
  git checkout main
  git pull origin main
  git checkout -b cursor/<описание>-e872
  ```
- Имя ветки: префикс `cursor/`, суффикс `-e872`, только строчные буквы.

### 2. Коммиты

- Делай **частые, атомарные** коммиты с понятными сообщениями.
- Формат: `тип: краткое описание` (например `feat:`, `fix:`, `docs:`, `chore:`).
- Перед тестированием — закоммить и запушить текущее состояние.

### 3. Push

- После каждого логического блока работы:
  ```bash
  git push -u origin cursor/<описание>-e872
  ```
- При сетевых ошибках — повторить до 4 раз с backoff (4s, 8s, 16s, 32s).

### 4. Pull Request

- **Всегда** интегрируй изменения через PR, не напрямую в `main`.
- Создавай PR сразу после первого push:
  - `base`: `main`
  - `branch`: твоя feature-ветка
- **Draft PR** — только пока работа ещё в процессе (ожидаешь ещё коммиты или проверки). Как только функциональность готова и проверки прошли — переведи PR в ready и переходи к merge (шаг 5). Не оставляй готовую работу в draft.
- Если задача одношаговая и сразу готова к ревью — создавай PR сразу **не в draft**.
- Обновляй PR при каждой новой итерации (после push).

### 5. Merge (обязательный финальный шаг)

- После завершения работы и прохождения проверок — **обязательно слей PR в `main`**. Не жди, пока пользователь попросит.
- Команды:
  ```bash
  gh pr ready <номер>    # если PR был draft
  gh pr merge <номер> --merge --delete-branch
  git checkout main && git pull origin main
  ```
- Убедись, что PR зелёный и конфликтов нет.
- После merge удали feature-ветку (локально и на remote), если она больше не нужна.

### 6. Цикл итерации

```
main → feature branch → commit → push → PR (create/update)
  → тесты → commit → push → update PR → merge в main
```

Повторяй commit → push → update PR на **каждой итерации**, включая финальную. **Финальная итерация всегда заканчивается merge в `main`.**

## Чего не делать

- Не пушить напрямую в `main`.
- Не оставлять незакоммиченные изменения в конце сессии.
- Не мержить без PR.
- **Не завершать сессию с открытым (особенно draft) PR**, если пользователь не попросил иначе.
- Не создавать гигантские коммиты — разбивай на логические части.

## Деплой

Production: https://focus.etretyakov.ru

### Удалённый сервер

Агент **может и должен** подключаться к production VPS по SSH и выполнять деплой, настройку nginx, миграции и проверки.

Секреты доступа задаются в переменных окружения Cloud Agent:

| Переменная | Назначение |
|------------|------------|
| `DEPLOY_HOST` | IP или hostname VPS |
| `DEPLOY_USER` | SSH-пользователь (обычно `root`) |
| `DEPLOY_SSH_KEY` | Приватный SSH-ключ (OpenSSH, одной строкой) |

Подключение:

```bash
# Ключ в env приходит в одну строку — перед использованием отформатировать:
python3 -c "
import os, re, textwrap
key = os.environ['DEPLOY_SSH_KEY'].strip()
m = re.search(r'-----BEGIN OPENSSH PRIVATE KEY-----\s*(.+?)\s*-----END OPENSSH PRIVATE KEY-----', key)
body = m.group(1).replace(' ', '')
wrapped = chr(10).join(textwrap.wrap(body, 70))
open(os.path.expanduser('~/.ssh/deploy_key'), 'w').write(
    f'-----BEGIN OPENSSH PRIVATE KEY-----{chr(10)}{wrapped}{chr(10)}-----END OPENSSH PRIVATE KEY-----{chr(10)}')
"
chmod 600 ~/.ssh/deploy_key
ssh -i ~/.ssh/deploy_key ${DEPLOY_USER}@${DEPLOY_HOST}
```

### Структура на сервере

| Путь | Описание |
|------|----------|
| `/opt/focus` | Клон репозитория |
| `/opt/focus/.env` | Production-секреты (`DB_PASSWORD`, `SESSION_SECRET`, `OWNER_PASSWORD_HASH`) |
| `/opt/focus/.owner-password` | Пароль владельца (plaintext, chmod 600) |
| `/opt/focus/backups/` | Ежедневные pg_dump (cron 03:00) |
| `/etc/nginx/sites-available/focus.etretyakov.ru` | nginx reverse proxy → `127.0.0.1:3003` |

На VPS уже работает **nginx + certbot** (другие поддомены). Focus использует `docker-compose.prod-nginx.yml` (без Caddy). Приложение слушает `127.0.0.1:3003`.

### Деплой / обновление

```bash
ssh -i ~/.ssh/deploy_key ${DEPLOY_USER}@${DEPLOY_HOST}
cd /opt/focus
git pull origin main
docker compose -f docker-compose.prod-nginx.yml up -d --build
# Миграции (если prisma CLI недоступен в образе — через psql):
docker compose -f docker-compose.prod-nginx.yml exec -T db psql -U focus -d focus \
  < prisma/migrations/<latest>/migration.sql
nginx -t && systemctl reload nginx
```

Или из локальной среды агента: `bash scripts/deploy-remote.sh` (после настройки ключа).

**Важно:** в `.env` для docker compose символы `$` в bcrypt-хеше экранируются как `$$`.

Секреты генерируй сам (`openssl rand`, `npm run hash-password`). Не коммить `.env` и пароли в репозиторий.

Деплой с ветки `main` после merge PR:

- **Автоматически:** GitHub Actions (`.github/workflows/deploy.yml`) после зелёного CI на `main`. Секреты: `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY` — см. [docs/deploy-github-actions.md](docs/deploy-github-actions.md).
- **Вручную:** `bash scripts/deploy-remote.sh` или SSH-команды ниже.

Подробности — в [README.md](README.md) и [docs/deploy-github-actions.md](docs/deploy-github-actions.md).

## Документация

- [README.md](README.md) — обзор проекта, быстрый старт
- [docs/superpowers/specs/](docs/superpowers/specs/) — design-спецификации
- [docs/superpowers/plans/](docs/superpowers/plans/) — планы реализации
