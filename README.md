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

# 2. Boot the workspace — Postgres + the AbsoluteJS dev server start
#    together, the app waits for the DB's TCP probe, and both go down
#    on Ctrl+C.
bun run dev
```

Open **http://localhost:3000** — a demo board is auto-seeded on first
start. The landing-page CTA links straight to it.

The first time you bring up the workspace on a fresh DB, you'll need to
apply the schema once. `drizzle-kit push` silently hangs on Bun/macOS
(see [Caveats](#caveats)), so the working flow is `generate` + `psql`:

```sh
bun run db:generate
docker exec -i postgresql-db-1 psql -U user -d database \
  < db/migrations/0000_*.sql
```

After that, the schema persists in the named docker volume (`db_data`)
across restarts — you only redo this if you wipe the volume or change
the schema.

### Connection details

The Postgres container is provisioned with these credentials, hard-coded
in [`db/connection.ts`](./db/connection.ts) and matched to
[`db/docker-compose.db.yml`](./db/docker-compose.db.yml):

```
postgresql://user:password@127.0.0.1:5433/database
```

There's no `.env` — these are local-only secrets and live next to the
compose file as constants. If you need to point at a different database
(e.g., a hosted one for prod), this is the one place to change.

> **macOS heads-up.** The Docker port is **5433**, not 5432. This avoids
> conflicting with a system Postgres bound to `localhost:5432` (e.g.
> Postgres.app, `brew services start postgresql`), which silently shadows
> the container — see [Caveats](#caveats).

## Workspace orchestration

`absolute.config.ts` defines two services and `bun run dev` boots both
through `absolute workspace dev` (a TUI workspace orchestrator):

```ts
defineConfig({
  db: {
    kind: 'command',
    command: ['docker', 'compose', '-f', 'db/docker-compose.db.yml', 'up', 'db'],
    ready: { type: 'tcp', host: '127.0.0.1', port: 5433 },
    shutdown: { command: [/* … */ 'down'] },
    port: 5433,
    visibility: 'internal'
  },
  app: {
    kind: 'absolute',
    entry: 'src/backend/server.ts',
    dependsOn: ['db'],
    /* … usual AbsoluteJS build config … */
  }
});
```

`db` blocks until the TCP probe on `5433` succeeds; `app` then starts
because of `dependsOn: ['db']`. On Ctrl+C the workspace runs the
`shutdown.command` for the DB, so the container always tears down with
the dev server.

## Scripts

| Command               | What it does                                                                |
| --------------------- | --------------------------------------------------------------------------- |
| `bun run dev`         | Start the workspace (DB + app) on http://localhost:3000                     |
| `bun run typecheck`   | `tsc --noEmit` across the whole project                                     |
| `bun run lint`        | ESLint via the AbsoluteJS plugin                                            |
| `bun run format`      | Prettier across `.js / .ts / .css / .json / .mjs / .md / .vue`              |
| `bun run db:generate` | Emit `db/migrations/*.sql` from `db/schema.ts` (`drizzle-kit generate`)     |
| `bun run db:reset`    | Stop the container **and wipe the data volume** (destructive)               |
| `bun run db:psql`     | Open a `psql` shell inside the running DB container                         |
| `bun run db:studio`   | Open Drizzle Studio against the running container                           |

## Project layout

```
absolute-flow/
├── absolute.config.ts           Workspace config: `db` + `app` services
├── drizzle.config.ts            Drizzle migration config (postgresql, pg driver)
├── db/
│   ├── connection.ts            DB credentials + DATABASE_URL constant
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

- **`drizzle-kit push` hangs silently on Bun + macOS** with both `pg`
  and `postgres` drivers, regardless of `strict` mode. We don't ship a
  `db:push` script for that reason — use `bun run db:generate` and pipe
  the SQL into the running container, as in [Quick start](#quick-start).

- **Docker port 5433.** The `db/docker-compose.db.yml` binds **5433** on
  the host (mapped to 5432 in the container) to dodge a host-bound
  Postgres on macOS that would otherwise intercept connections to
  `localhost:5432` and reject the URL's user with confusing errors.

## Status

This is a demo, not a product. There's no auth, no multi-board UI, no
mobile layout pass, and the perf badge is intentionally always-visible —
it's part of the showcase. Everything you see is the actual stack
running, no mocks.
