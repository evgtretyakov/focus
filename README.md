# Focus

Личный веб-сервис для управления текущими активностями. Доступ с любого устройства через браузер.

**Production:** https://focus.etretyakov.ru

## Возможности

- Таблица активностей: название, приоритет (цветные кружки), дедлайн
- Разворачиваемые сниппеты с подзадачами
- Добавление и отметка подзадач выполненными
- Синхронизация между устройствами через сервер
- Адаптивный интерфейс (desktop + mobile)

## Стек

| Компонент | Технология |
|-----------|------------|
| Frontend / API | Next.js 15, React 19, TypeScript |
| Стили | Tailwind CSS 4 |
| БД | PostgreSQL 16, Prisma |
| Auth | iron-session (single-user) |
| Тесты | Vitest, Playwright |
| Деплой | Docker Compose, Caddy |

## Документация

- [Design Spec](docs/superpowers/specs/2026-06-05-focus-design.md) — архитектура, модель данных, UI
- [Implementation Plan](docs/superpowers/plans/2026-06-05-focus-implementation.md) — пошаговый план разработки (13 задач)

## Быстрый старт (разработка)

### Требования

- Node.js 22+
- Docker (для PostgreSQL)

### Установка

```bash
git clone <repo-url>
cd focus
npm install
cp .env.example .env
```

### Настройка `.env`

```env
DATABASE_URL="postgresql://focus:focus@localhost:5432/focus?schema=public"
SESSION_SECRET="your-random-secret-min-32-chars"
OWNER_PASSWORD_HASH=""   # см. ниже
```

Сгенерировать хеш пароля:

```bash
npm run hash-password -- "your-password"
# вставить вывод в OWNER_PASSWORD_HASH
```

### Запуск

```bash
docker compose up -d db      # PostgreSQL
npm run db:migrate           # миграции
npm run dev                  # http://localhost:3000
```

### Тесты

```bash
npm test                     # unit-тесты (Vitest)
npm run test:e2e             # e2e smoke (Playwright)
```

## Деплой (production)

### 1. DNS

A-запись: `focus.etretyakov.ru` → IP вашего VPS.

### 2. Секреты

```bash
npm run hash-password -- "secure-production-password"
openssl rand -base64 32   # SESSION_SECRET
openssl rand -base64 24   # DB_PASSWORD
```

### 3. Запуск на сервере

```bash
git clone <repo-url> /opt/focus
cd /opt/focus
cp .env.example .env
# заполнить .env production-значениями:
# DB_PASSWORD, SESSION_SECRET, OWNER_PASSWORD_HASH

# Вариант A: VPS с Caddy (порты 80/443 свободны)
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml exec app npx prisma migrate deploy

# Вариант B: VPS с существующим nginx (как focus.etretyakov.ru)
docker compose -f docker-compose.prod-nginx.yml up -d --build
# nginx + certbot настраиваются отдельно (см. deploy/nginx/)
```

Caddy автоматически получит TLS-сертификат для `focus.etretyakov.ru`.

### 4. Бэкап (рекомендуется)

```bash
mkdir -p /opt/focus/backups
# crontab -e:
0 3 * * * docker compose -f /opt/focus/docker-compose.prod.yml exec -T db pg_dump -U focus focus > /opt/focus/backups/focus-$(date +\%Y\%m\%d).sql
```

## Структура проекта

```
docs/superpowers/
├── specs/    # design-спецификации
└── plans/    # implementation-планы
prisma/       # схема и миграции БД
src/
├── app/      # Next.js pages и API routes
├── components/
└── lib/      # prisma, auth, helpers
tests/
├── unit/
└── e2e/
```

## Roadmap

- [x] Design spec
- [x] Implementation plan
- [x] MVP: auth, activities, subtasks, responsive UI
- [x] Deploy to focus.etretyakov.ru
- [ ] Phase 2: drag-and-drop, archive, PWA
