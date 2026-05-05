# AbsoluteFlow

A small, full-stack Kanban app — drag-and-drop columns and tasks, layout
animations, optimistic persistence — built as a flagship demo for the
**[AbsoluteJS](https://absolutejs.com)** + **Vue 3** + **Drizzle** stack.

Two routes:

- `/` — server-rendered marketing landing page
- `/board/:id` — the live Kanban board, hydrated client-side, persisted to
  Postgres on every move/edit

Both pages carry a floating **PerfBadge** in the bottom-right corner that
surfaces AbsoluteJS metadata (version, page, hydration latency, mode) and
live Core Web Vitals (LCP / INP / CLS / FCP / TTFB) measured by Google's
[`web-vitals`](https://github.com/GoogleChrome/web-vitals) library and
color-coded against Google's official rating thresholds.

## Stack

| Layer        | Choice                                            |
| ------------ | ------------------------------------------------- |
| Runtime      | [Bun](https://bun.sh)                             |
| Server       | [Elysia](https://elysiajs.com) on AbsoluteJS      |
| Frontend     | Vue 3 SFCs, Composition API                       |
| Styling      | Tailwind CSS v4 (CSS-first config, `@theme`)      |
| Drag & drop  | [vue-draggable-plus](https://github.com/Alfred-Skyblue/vue-draggable-plus) (SortableJS wrapper) |
| Animations   | Vue's built-in `<TransitionGroup>` (FLIP)         |
| ORM          | [Drizzle](https://orm.drizzle.team) on `bun-sql`  |
| Database     | Postgres 15 (Docker)                              |
| Perf metrics | [`web-vitals`](https://github.com/GoogleChrome/web-vitals) |

## Quick start

Prerequisites: **Bun ≥ 1.3** and **Docker** running locally.

```sh
# 1. Install dependencies
bun install

# 2. Start Postgres in Docker (binds host port 5433 → container 5432)
bun run db:up

# 3. Apply the schema
#    drizzle-kit push silently hangs on this Bun/macOS combo, so we
#    generate SQL and apply it with psql via docker exec:
bunx drizzle-kit generate
docker exec -i postgresql-db-1 psql -U user -d database \
  < db/migrations/0000_*.sql

# 4. Boot the dev server
bun run dev
```

Open **http://localhost:3000** — a demo board is auto-seeded the first time
the server starts. The landing-page CTA links straight to it.

`.env` is read by both the server and Drizzle:

```
DATABASE_URL=postgresql://user:password@127.0.0.1:5433/database
```

> **macOS heads-up.** The Docker mapping is **5433**, not 5432. This avoids
> conflicting with a system Postgres bound to `localhost:5432` (e.g.
> Postgres.app, `brew services start postgresql`), which silently shadows
> the container otherwise — see [Caveats](#caveats).

## Scripts

| Command               | What it does                                                                |
| --------------------- | --------------------------------------------------------------------------- |
| `bun run dev`         | Start AbsoluteJS dev server with HMR on http://localhost:3000               |
| `bun run typecheck`   | `tsc --noEmit` against the whole project                                    |
| `bun run lint`        | ESLint via the AbsoluteJS plugin                                            |
| `bun run format`      | Prettier across `.js / .ts / .css / .json / .mjs / .md / .vue`              |
| `bun run db:up`       | `docker compose up` Postgres                                                |
| `bun run db:down`     | Stop the container                                                          |
| `bun run db:reset`    | Stop **and** wipe the volume (destructive)                                  |
| `bun run db:postgresql` | Open a `psql` shell inside the container (auto starts/stops the DB)       |
| `bun run db:studio`   | Open Drizzle Studio                                                         |
| `bun run db:push`     | Drizzle migration push — currently hangs on Bun/macOS, see Quick start      |

## Project layout

```
absolute-flow/
├── absolute.config.ts           AbsoluteJS build config (Vue, Tailwind v4)
├── drizzle.config.ts            Drizzle migration config (postgresql, pg driver)
├── db/
│   ├── docker-compose.db.yml    Postgres 15, port 5433
│   ├── schema.ts                boards / columns / tasks (UUID PKs, FK cascades)
│   └── migrations/              drizzle-kit generate output (gitignored .sql)
├── src/
│   ├── backend/
│   │   ├── server.ts            Elysia routes + SSR page handlers
│   │   ├── db.ts                Shared Drizzle client (Bun SQL)
│   │   └── handlers/            Per-table query helpers (boards/columns/tasks)
│   ├── frontend/
│   │   ├── pages/
│   │   │   ├── LandingPage.vue  Marketing page (SSR, no client logic)
│   │   │   └── BoardPage.vue    SSR shell + <KanbanBoard>
│   │   ├── components/
│   │   │   ├── KanbanBoard.vue  Drag, edit, add, delete; optimistic API calls
│   │   │   └── PerfBadge.vue    Floating CWV + AbsoluteJS info widget
│   │   └── composables/
│   │       └── usePerfBadge.ts  web-vitals subscriptions, hydration timing
│   └── styles/
│       ├── tailwind.css         @theme tokens, glass utilities, base styles
│       └── reset.css
└── public/
```

## API

The Elysia routes are validated with `t.Object(...)` schemas and exposed as
typed Eden Treaty contracts via `export type Server`.

| Method | Path                       | Body / params                                                |
| ------ | -------------------------- | ------------------------------------------------------------ |
| GET    | `/`                        | SSR landing                                                  |
| GET    | `/board/:id`               | SSR Kanban (404 if board missing)                            |
| GET    | `/api/boards/:id`          | Full board with columns + ordered tasks                      |
| GET    | `/api/boards/demo/id`      | `{ id }` — id of the auto-seeded demo board                  |
| POST   | `/api/columns`             | `{ boardId, title, orderIndex }`                             |
| PATCH  | `/api/columns/:id`         | `{ title?, orderIndex? }`                                    |
| DELETE | `/api/columns/:id`         | —                                                            |
| POST   | `/api/tasks`               | `{ columnId, content, description?, orderIndex }`            |
| PATCH  | `/api/tasks/:id`           | `{ columnId?, content?, description?, orderIndex? }`         |
| DELETE | `/api/tasks/:id`           | —                                                            |
| GET    | `/swagger`                 | Auto-generated Swagger UI                                    |
| GET    | `/health`                  | `{ ok, db, demoBoardId }` for quick liveness checks          |

Drag operations PATCH a single task with its new `{ columnId, orderIndex }`.
The UI moves first; the network call follows. On failure the page
re-fetches state to recover.

## Caveats

- **`@angular/compiler` is in devDependencies despite this being a
  Vue-only project.** AbsoluteJS `0.19.0-beta.872` has a static
  `import * as o from "@angular/compiler"` in its bundled dev runtime
  (`dist/index.js:17747`). The module fails to load without that package
  installed, even when no Angular code path will ever run. See
  [`FOR_ALEX_ANGULAR_BUG.md`](./FOR_ALEX_ANGULAR_BUG.md) for the full
  diagnosis and a one-line proposed fix in framework source.

- **`bun run db:push` hangs silently on Bun + macOS** with both `pg` and
  `postgres` drivers, regardless of `strict` mode. Workaround used in
  [Quick start](#quick-start): `drizzle-kit generate` + `psql`.

- **Docker port 5433.** The `db/docker-compose.db.yml` binds **5433** on
  the host (mapped to 5432 in the container) to dodge a host-bound
  Postgres on macOS that would otherwise intercept connections to
  `localhost:5432` and reject the URL's user with confusing errors.

## Status

This is a demo, not a product. There's no auth, no multi-board UI, no
mobile layout pass, and the perf badge is intentionally always-visible —
it's part of the showcase. Everything you see is the actual stack
running, no mocks.
