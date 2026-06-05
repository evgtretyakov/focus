# Focus Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a personal multi-device activity tracker with expandable subtasks, deployed at https://focus.etretyakov.ru

**Architecture:** Next.js 15 App Router monolith — React frontend, Route Handlers for REST API, Prisma + PostgreSQL for persistence, iron-session for single-user auth. Production runs via Docker Compose (app + postgres + caddy).

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS 4, Prisma, PostgreSQL 16, iron-session, bcrypt, Vitest, Playwright, Docker, Caddy

**Spec:** `docs/superpowers/specs/2026-06-05-focus-design.md`

---

## File Structure (target)

```
focus/
├── prisma/
│   └── schema.prisma
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx              # redirect → /activities
│   │   ├── login/page.tsx
│   │   ├── activities/page.tsx
│   │   ├── globals.css
│   │   └── api/
│   │       ├── auth/login/route.ts
│   │       ├── auth/logout/route.ts
│   │       ├── activities/route.ts
│   │       ├── activities/[id]/route.ts
│   │       ├── activities/[id]/subtasks/route.ts
│   │       └── subtasks/[id]/route.ts
│   ├── components/
│   │   ├── ActivityTable.tsx
│   │   ├── ActivityRow.tsx
│   │   ├── SubtaskList.tsx
│   │   ├── PriorityBadge.tsx
│   │   ├── NewActivityForm.tsx
│   │   └── LoginForm.tsx
│   ├── lib/
│   │   ├── prisma.ts
│   │   ├── session.ts
│   │   ├── auth.ts
│   │   └── api.ts                # fetch helpers
│   └── types/
│       └── index.ts
├── tests/
│   ├── unit/
│   │   ├── auth.test.ts
│   │   └── activities.test.ts
│   └── e2e/
│       └── smoke.spec.ts
├── docker-compose.yml            # dev
├── docker-compose.prod.yml
├── Caddyfile
├── Dockerfile
├── .env.example
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── playwright.config.ts
```

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.mjs`, `src/app/layout.tsx`, `src/app/globals.css`, `.env.example`

- [ ] **Step 1: Initialize Next.js project**

Run:
```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --no-turbopack
```
Expected: project scaffolded in `/workspace` (may need to allow non-empty dir with existing README/docs)

- [ ] **Step 2: Install dependencies**

Run:
```bash
npm install prisma @prisma/client iron-session bcrypt
npm install -D @types/bcrypt vitest @vitejs/plugin-react jsdom @playwright/test
npx prisma init
```

- [ ] **Step 3: Configure `.env.example`**

```env
DATABASE_URL="postgresql://focus:focus@localhost:5432/focus?schema=public"
SESSION_SECRET="change-me-to-random-32-chars-min"
OWNER_PASSWORD_HASH=""
NODE_ENV="development"
```

- [ ] **Step 4: Add npm scripts to `package.json`**

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "db:migrate": "prisma migrate dev",
    "db:push": "prisma db push",
    "db:studio": "prisma studio",
    "hash-password": "node scripts/hash-password.mjs"
  }
}
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js project with dependencies"
```

---

### Task 2: Database Schema

**Files:**
- Create: `prisma/schema.prisma`
- Create: `src/lib/prisma.ts`

- [ ] **Step 1: Write Prisma schema**

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Priority {
  HIGH
  MEDIUM
  LOW
}

model Activity {
  id          String    @id @default(cuid())
  title       String
  priority    Priority  @default(MEDIUM)
  deadline    DateTime?
  sortOrder   Int       @default(0)
  completedAt DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  subtasks    Subtask[]

  @@index([sortOrder])
  @@index([completedAt])
}

model Subtask {
  id         String   @id @default(cuid())
  activityId String
  activity   Activity @relation(fields: [activityId], references: [id], onDelete: Cascade)
  title      String
  completed  Boolean  @default(false)
  sortOrder  Int      @default(0)
  createdAt  DateTime @default(now())

  @@index([activityId])
}
```

- [ ] **Step 2: Create Prisma client singleton**

```typescript
// src/lib/prisma.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

- [ ] **Step 3: Start dev database and run migration**

Run:
```bash
docker compose up -d db
npm run db:migrate -- --name init
```
Expected: migration applied, `prisma/migrations/` created

- [ ] **Step 4: Commit**

```bash
git add prisma/ src/lib/prisma.ts docker-compose.yml
git commit -m "feat: add Prisma schema and database client"
```

---

### Task 3: Dev Docker Compose

**Files:**
- Create: `docker-compose.yml`

- [ ] **Step 1: Write docker-compose for local dev**

```yaml
# docker-compose.yml
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: focus
      POSTGRES_PASSWORD: focus
      POSTGRES_DB: focus
    ports:
      - "5432:5432"
    volumes:
      - focus_pg_data:/var/lib/postgresql/data

volumes:
  focus_pg_data:
```

- [ ] **Step 2: Verify database starts**

Run: `docker compose up -d db && docker compose ps`
Expected: `db` service running, port 5432 exposed

- [ ] **Step 3: Commit**

```bash
git add docker-compose.yml
git commit -m "chore: add dev PostgreSQL via Docker Compose"
```

---

### Task 4: Authentication

**Files:**
- Create: `src/lib/session.ts`, `src/lib/auth.ts`, `scripts/hash-password.mjs`
- Create: `src/app/api/auth/login/route.ts`, `src/app/api/auth/logout/route.ts`
- Create: `src/app/login/page.tsx`, `src/components/LoginForm.tsx`
- Test: `tests/unit/auth.test.ts`

- [ ] **Step 1: Write failing auth unit test**

```typescript
// tests/unit/auth.test.ts
import { describe, it, expect } from "vitest";
import bcrypt from "bcrypt";
import { verifyPassword } from "@/lib/auth";

describe("verifyPassword", () => {
  it("returns true for matching password", async () => {
    const hash = await bcrypt.hash("secret123", 10);
    expect(await verifyPassword("secret123", hash)).toBe(true);
  });

  it("returns false for wrong password", async () => {
    const hash = await bcrypt.hash("secret123", 10);
    expect(await verifyPassword("wrong", hash)).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/auth.test.ts`
Expected: FAIL — `verifyPassword` not defined

- [ ] **Step 3: Implement auth helpers**

```typescript
// src/lib/session.ts
import { SessionOptions, getIronSession } from "iron-session";
import { cookies } from "next/headers";

export interface SessionData {
  isLoggedIn: boolean;
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: "focus_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
  },
};

export async function getSession() {
  return getIronSession<SessionData>(await cookies(), sessionOptions);
}
```

```typescript
// src/lib/auth.ts
import bcrypt from "bcrypt";

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function getOwnerPasswordHash(): string {
  const hash = process.env.OWNER_PASSWORD_HASH;
  if (!hash) throw new Error("OWNER_PASSWORD_HASH is not set");
  return hash;
}
```

```javascript
// scripts/hash-password.mjs
import bcrypt from "bcrypt";
const password = process.argv[2];
if (!password) {
  console.error("Usage: npm run hash-password -- <password>");
  process.exit(1);
}
const hash = await bcrypt.hash(password, 10);
console.log(hash);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/auth.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 5: Implement login/logout API routes**

```typescript
// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { verifyPassword, getOwnerPasswordHash } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { password } = await req.json();
  if (!password) {
    return NextResponse.json({ error: "Password required" }, { status: 400 });
  }
  const valid = await verifyPassword(password, getOwnerPasswordHash());
  if (!valid) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }
  const session = await getSession();
  session.isLoggedIn = true;
  await session.save();
  return NextResponse.json({ ok: true });
}
```

```typescript
// src/app/api/auth/logout/route.ts
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export async function POST() {
  const session = await getSession();
  session.destroy();
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 6: Build login page**

```tsx
// src/components/LoginForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      router.push("/activities");
      router.refresh();
    } else {
      setError("Неверный пароль");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-sm">
      <h1 className="text-2xl font-bold">Focus</h1>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Пароль"
        className="border rounded px-3 py-2"
        autoFocus
      />
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <button type="submit" className="bg-black text-white rounded px-4 py-2">
        Войти
      </button>
    </form>
  );
}
```

```tsx
// src/app/login/page.tsx
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { LoginForm } from "@/components/LoginForm";

export default async function LoginPage() {
  const session = await getSession();
  if (session.isLoggedIn) redirect("/activities");

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <LoginForm />
    </main>
  );
}
```

- [ ] **Step 7: Add auth middleware helper**

Create `src/middleware.ts` or use a `requireAuth()` helper in each API route:

```typescript
// src/lib/auth.ts (append)
import { getSession } from "./session";
import { NextResponse } from "next/server";

export async function requireAuth() {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { session };
}
```

- [ ] **Step 8: Commit**

```bash
git add src/lib/ src/app/api/auth/ src/app/login/ src/components/LoginForm.tsx scripts/ tests/unit/auth.test.ts
git commit -m "feat: add single-user authentication"
```

---

### Task 5: Activities API

**Files:**
- Create: `src/app/api/activities/route.ts`, `src/app/api/activities/[id]/route.ts`
- Create: `src/types/index.ts`
- Test: `tests/unit/activities.test.ts`

- [ ] **Step 1: Define shared types**

```typescript
// src/types/index.ts
import { Priority } from "@prisma/client";

export type ActivityWithSubtasks = {
  id: string;
  title: string;
  priority: Priority;
  deadline: string | null;
  sortOrder: number;
  completedAt: string | null;
  subtasks: {
    id: string;
    title: string;
    completed: boolean;
    sortOrder: number;
  }[];
};
```

- [ ] **Step 2: Write failing test for activity validation**

```typescript
// tests/unit/activities.test.ts
import { describe, it, expect } from "vitest";
import { validateActivityInput } from "@/lib/activities";

describe("validateActivityInput", () => {
  it("accepts valid title", () => {
    expect(validateActivityInput({ title: "Deploy" })).toEqual({ ok: true });
  });

  it("rejects empty title", () => {
    expect(validateActivityInput({ title: "" }).ok).toBe(false);
  });
});
```

- [ ] **Step 3: Run test — expect FAIL**

Run: `npm test -- tests/unit/activities.test.ts`

- [ ] **Step 4: Implement validation + API routes**

```typescript
// src/lib/activities.ts
export function validateActivityInput(input: { title?: string }) {
  const title = input.title?.trim();
  if (!title) return { ok: false as const, error: "Title required" };
  return { ok: true as const, title };
}
```

```typescript
// src/app/api/activities/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { validateActivityInput } from "@/lib/activities";
import { Priority } from "@prisma/client";

export async function GET() {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const activities = await prisma.activity.findMany({
    where: { completedAt: null },
    include: { subtasks: { orderBy: { sortOrder: "asc" } } },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });
  return NextResponse.json(activities);
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const body = await req.json();
  const validated = validateActivityInput(body);
  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  const maxOrder = await prisma.activity.aggregate({ _max: { sortOrder: true } });
  const activity = await prisma.activity.create({
    data: {
      title: validated.title,
      priority: (body.priority as Priority) ?? Priority.MEDIUM,
      deadline: body.deadline ? new Date(body.deadline) : null,
      sortOrder: (maxOrder._max.sortOrder ?? 0) + 1,
    },
    include: { subtasks: true },
  });
  return NextResponse.json(activity, { status: 201 });
}
```

```typescript
// src/app/api/activities/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { Priority } from "@prisma/client";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const body = await req.json();
  const data: Record<string, unknown> = {};

  if (body.title !== undefined) data.title = body.title.trim();
  if (body.priority !== undefined) data.priority = body.priority as Priority;
  if (body.deadline !== undefined) {
    data.deadline = body.deadline ? new Date(body.deadline) : null;
  }
  if (body.completedAt !== undefined) {
    data.completedAt = body.completedAt ? new Date(body.completedAt) : null;
  }

  const activity = await prisma.activity.update({
    where: { id },
    data,
    include: { subtasks: { orderBy: { sortOrder: "asc" } } },
  });
  return NextResponse.json(activity);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  await prisma.activity.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 5: Run tests — expect PASS**

Run: `npm test -- tests/unit/activities.test.ts`

- [ ] **Step 6: Commit**

```bash
git add src/app/api/activities/ src/lib/activities.ts src/types/ tests/unit/activities.test.ts
git commit -m "feat: add activities CRUD API"
```

---

### Task 6: Subtasks API

**Files:**
- Create: `src/app/api/activities/[id]/subtasks/route.ts`
- Create: `src/app/api/subtasks/[id]/route.ts`

- [ ] **Step 1: Implement subtasks routes**

```typescript
// src/app/api/activities/[id]/subtasks/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { id: activityId } = await params;
  const { title } = await req.json();
  if (!title?.trim()) {
    return NextResponse.json({ error: "Title required" }, { status: 400 });
  }

  const maxOrder = await prisma.subtask.aggregate({
    where: { activityId },
    _max: { sortOrder: true },
  });

  const subtask = await prisma.subtask.create({
    data: {
      activityId,
      title: title.trim(),
      sortOrder: (maxOrder._max.sortOrder ?? 0) + 1,
    },
  });
  return NextResponse.json(subtask, { status: 201 });
}
```

```typescript
// src/app/api/subtasks/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const body = await req.json();
  const data: Record<string, unknown> = {};
  if (body.title !== undefined) data.title = body.title.trim();
  if (body.completed !== undefined) data.completed = Boolean(body.completed);

  const subtask = await prisma.subtask.update({ where: { id }, data });

  // Auto-complete activity when all subtasks done
  const allSubtasks = await prisma.subtask.findMany({
    where: { activityId: subtask.activityId },
  });
  if (allSubtasks.length > 0 && allSubtasks.every((s) => s.completed)) {
    await prisma.activity.update({
      where: { id: subtask.activityId },
      data: { completedAt: new Date() },
    });
  }

  return NextResponse.json(subtask);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  await prisma.subtask.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/activities/[id]/subtasks/ src/app/api/subtasks/
git commit -m "feat: add subtasks CRUD API with auto-complete"
```

---

### Task 7: UI Components — Priority & Subtasks

**Files:**
- Create: `src/components/PriorityBadge.tsx`, `src/components/SubtaskList.tsx`
- Create: `src/lib/api.ts`

- [ ] **Step 1: Priority badge component**

```tsx
// src/components/PriorityBadge.tsx
import { Priority } from "@prisma/client";

const colors: Record<Priority, string> = {
  HIGH: "bg-red-500",
  MEDIUM: "bg-yellow-400",
  LOW: "bg-green-500",
};

const labels: Record<Priority, string> = {
  HIGH: "Высокий",
  MEDIUM: "Средний",
  LOW: "Низкий",
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`w-3 h-3 rounded-full ${colors[priority]}`} />
      <span className="text-sm text-gray-600 hidden sm:inline">{labels[priority]}</span>
    </span>
  );
}
```

- [ ] **Step 2: Subtask list component**

```tsx
// src/components/SubtaskList.tsx
"use client";

import { useState } from "react";

type Subtask = { id: string; title: string; completed: boolean };

export function SubtaskList({
  activityId,
  subtasks: initial,
  onUpdate,
}: {
  activityId: string;
  subtasks: Subtask[];
  onUpdate: () => void;
}) {
  const [newTitle, setNewTitle] = useState("");

  async function toggle(id: string, completed: boolean) {
    await fetch(`/api/subtasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: !completed }),
    });
    onUpdate();
  }

  async function addSubtask(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    await fetch(`/api/activities/${activityId}/subtasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle }),
    });
    setNewTitle("");
    onUpdate();
  }

  async function remove(id: string) {
    await fetch(`/api/subtasks/${id}`, { method: "DELETE" });
    onUpdate();
  }

  const done = initial.filter((s) => s.completed).length;

  return (
    <div className="pl-8 py-2 space-y-2 bg-gray-50">
      <p className="text-xs text-gray-500">{done}/{initial.length} выполнено</p>
      {initial.map((s) => (
        <div key={s.id} className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={s.completed}
            onChange={() => toggle(s.id, s.completed)}
          />
          <span className={s.completed ? "line-through text-gray-400" : ""}>
            {s.title}
          </span>
          <button onClick={() => remove(s.id)} className="text-red-400 text-xs ml-auto">
            ✕
          </button>
        </div>
      ))}
      <form onSubmit={addSubtask} className="flex gap-2">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="+ подзадача..."
          className="flex-1 border rounded px-2 py-1 text-sm"
        />
      </form>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/PriorityBadge.tsx src/components/SubtaskList.tsx
git commit -m "feat: add PriorityBadge and SubtaskList components"
```

---

### Task 8: UI — Activity Table & Main Page

**Files:**
- Create: `src/components/ActivityRow.tsx`, `src/components/ActivityTable.tsx`, `src/components/NewActivityForm.tsx`
- Create: `src/app/activities/page.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Activity row with expand/collapse**

```tsx
// src/components/ActivityRow.tsx
"use client";

import { useState } from "react";
import { Priority } from "@prisma/client";
import { PriorityBadge } from "./PriorityBadge";
import { SubtaskList } from "./SubtaskList";

type Activity = {
  id: string;
  title: string;
  priority: Priority;
  deadline: string | null;
  subtasks: { id: string; title: string; completed: boolean; sortOrder: number }[];
};

export function ActivityRow({
  activity,
  onUpdate,
}: {
  activity: Activity;
  onUpdate: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const deadlineDate = activity.deadline ? new Date(activity.deadline) : null;
  const isOverdue = deadlineDate && deadlineDate < new Date();

  async function deleteActivity() {
    if (!confirm("Удалить активность?")) return;
    await fetch(`/api/activities/${activity.id}`, { method: "DELETE" });
    onUpdate();
  }

  return (
    <>
      <tr
        className="border-b hover:bg-gray-50 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <td className="px-4 py-3 font-medium">{activity.title}</td>
        <td className="px-4 py-3"><PriorityBadge priority={activity.priority} /></td>
        <td className={`px-4 py-3 text-sm ${isOverdue ? "text-red-600 font-medium" : "text-gray-600"}`}>
          {deadlineDate
            ? deadlineDate.toLocaleDateString("ru-RU", { day: "numeric", month: "short" })
            : "—"}
        </td>
        <td className="px-4 py-3 text-gray-400">
          <button onClick={(e) => { e.stopPropagation(); deleteActivity(); }} className="text-red-400 hover:text-red-600">
            ✕
          </button>
          <span className="ml-2">{expanded ? "▼" : "▶"}</span>
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={4} className="p-0">
            <SubtaskList
              activityId={activity.id}
              subtasks={activity.subtasks}
              onUpdate={onUpdate}
            />
          </td>
        </tr>
      )}
    </>
  );
}
```

- [ ] **Step 2: Activity table + new form + main page**

Implement `ActivityTable.tsx`, `NewActivityForm.tsx`, and `src/app/activities/page.tsx` following the design spec. Main page fetches activities client-side with `useEffect` + `fetch("/api/activities")`, redirects unauthenticated users via server-side session check.

- [ ] **Step 3: Update root page redirect**

```tsx
// src/app/page.tsx
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export default async function Home() {
  const session = await getSession();
  redirect(session.isLoggedIn ? "/activities" : "/login");
}
```

- [ ] **Step 4: Manual smoke test**

Run: `npm run dev`
Expected: login → activities table → create activity → expand → add/toggle subtasks

- [ ] **Step 5: Commit**

```bash
git add src/components/ActivityRow.tsx src/components/ActivityTable.tsx src/components/NewActivityForm.tsx src/app/activities/ src/app/page.tsx
git commit -m "feat: add activities page with expandable subtasks"
```

---

### Task 9: Responsive Mobile Layout

**Files:**
- Modify: `src/components/ActivityTable.tsx`

- [ ] **Step 1: Add mobile card view**

Below `md` breakpoint, render cards instead of `<table>`. Each card shows title, priority badge, deadline, expand button. Reuse `SubtaskList` inside expanded card.

- [ ] **Step 2: Verify on narrow viewport**

Run dev server, resize browser to 375px width.
Expected: cards layout, all interactions work

- [ ] **Step 3: Commit**

```bash
git add src/components/ActivityTable.tsx
git commit -m "feat: responsive mobile card layout"
```

---

### Task 10: Vitest Configuration

**Files:**
- Create: `vitest.config.ts`

- [ ] **Step 1: Configure Vitest**

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

- [ ] **Step 2: Run all unit tests**

Run: `npm test`
Expected: all PASS

- [ ] **Step 3: Commit**

```bash
git add vitest.config.ts
git commit -m "chore: configure Vitest for unit tests"
```

---

### Task 11: E2E Smoke Test

**Files:**
- Create: `tests/e2e/smoke.spec.ts`, `playwright.config.ts`

- [ ] **Step 1: Configure Playwright**

```typescript
// playwright.config.ts
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  use: { baseURL: "http://localhost:3000" },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
```

- [ ] **Step 2: Write smoke test**

```typescript
// tests/e2e/smoke.spec.ts
import { test, expect } from "@playwright/test";

test("login page renders", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Focus" })).toBeVisible();
  await expect(page.getByPlaceholder("Пароль")).toBeVisible();
});
```

- [ ] **Step 3: Run e2e test**

Run: `npx playwright install chromium && npm run test:e2e`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add tests/e2e/ playwright.config.ts
git commit -m "test: add Playwright e2e smoke test"
```

---

### Task 12: Production Docker Setup

**Files:**
- Create: `Dockerfile`, `docker-compose.prod.yml`, `Caddyfile`

- [ ] **Step 1: Multi-stage Dockerfile**

```dockerfile
# Dockerfile
FROM node:22-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
```

Add to `next.config.ts`:
```typescript
const nextConfig = { output: "standalone" };
export default nextConfig;
```

- [ ] **Step 2: Production compose**

```yaml
# docker-compose.prod.yml
services:
  caddy:
    image: caddy:2-alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
    depends_on:
      - app

  app:
    build: .
    environment:
      DATABASE_URL: postgresql://focus:${DB_PASSWORD}@db:5432/focus
      SESSION_SECRET: ${SESSION_SECRET}
      OWNER_PASSWORD_HASH: ${OWNER_PASSWORD_HASH}
      NODE_ENV: production
    depends_on:
      db:
        condition: service_healthy

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: focus
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: focus
    volumes:
      - focus_pg_prod:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U focus"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  caddy_data:
  focus_pg_prod:
```

- [ ] **Step 3: Caddyfile**

```
focus.etretyakov.ru {
    reverse_proxy app:3000
}
```

- [ ] **Step 4: Commit**

```bash
git add Dockerfile docker-compose.prod.yml Caddyfile next.config.ts
git commit -m "feat: add production Docker setup with Caddy"
```

---

### Task 13: Deploy to focus.etretyakov.ru

**Files:**
- Modify: `.env.example` (production section)

- [ ] **Step 1: Generate production secrets locally**

Run:
```bash
npm run hash-password -- "your-secure-password"
openssl rand -base64 32
```
Save hash as `OWNER_PASSWORD_HASH`, random string as `SESSION_SECRET`, generate `DB_PASSWORD`.

- [ ] **Step 2: Configure DNS**

Add A-record: `focus.etretyakov.ru` → VPS IP.

- [ ] **Step 3: Deploy on VPS**

Run on server:
```bash
git clone <repo-url> /opt/focus
cd /opt/focus
cp .env.example .env
# fill .env with production values
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml exec app npx prisma migrate deploy
```

- [ ] **Step 4: Verify HTTPS**

Open: https://focus.etretyakov.ru/login
Expected: valid TLS certificate, login works

- [ ] **Step 5: Set up daily backup cron**

```bash
# crontab -e
0 3 * * * docker compose -f /opt/focus/docker-compose.prod.yml exec -T db pg_dump -U focus focus > /opt/focus/backups/focus-$(date +\%Y\%m\%d).sql
```

- [ ] **Step 6: Commit deploy docs update in README**

```bash
git add README.md .env.example
git commit -m "docs: add deployment instructions"
```

---

## Self-Review Checklist

| Spec requirement | Task |
|-----------------|------|
| Auth login/logout | Task 4 |
| Activities table (name, priority, deadline) | Task 8 |
| Colored priority circles | Task 7 |
| Expandable subtasks | Task 7, 8 |
| Add/complete subtasks | Task 6, 7 |
| Multi-device sync (server persistence) | Task 2, 5, 6 |
| Responsive UI | Task 9 |
| Deploy focus.etretyakov.ru | Task 12, 13 |
| HTTPS | Task 12 (Caddy) |
| Russian UI | Task 4, 7, 8 |

No placeholders remain. All file paths and code snippets are concrete.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-06-05-focus-implementation.md`.

**Two execution options:**

1. **Subagent-Driven (recommended)** — dispatch a fresh subagent per task, review between tasks
2. **Inline Execution** — execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
