# AnchorPack

A personal backpacking gear manager — track gear, build outfits, and pack for trips.

## Features

- **Gear inventory** — catalog every piece of gear with manufacturer, weight, category, tier (1–3), and flags for primary / weighed / needs-charge. Parent/child relationships for grouped items (e.g. a pack and its internal pouches).
- **Outfits** — named gear loadouts built by picking from inventory. Quick-select by tier or primary. Live weight totals per category and for the whole outfit. Sticky left rail for category navigation with jump-to scrolling, filter-mode focus, and a scrollspy active highlight.
- **Trips** — reference an outfit to auto-populate a packing checklist. Track packed / charged state per item with optimistic UI.

## Tech stack

- Next.js 16 App Router (Server Components + Server Actions)
- React 19, TypeScript
- Drizzle ORM on Neon Postgres (HTTP driver)
- Tailwind CSS v4

## Getting started

Requires Node.js ≥ 20.9.0. If you use nvm: `nvm use 20`.

Set `DATABASE_URL` in `.env.local` pointing to a Neon Postgres instance, then:

```bash
npm install
npm run db:push    # push schema to Neon
npm run dev        # dev server at http://localhost:3000
```

## Commands

| Command | Description |
|---|---|
| `npm run dev` | Start the dev server on port 3000 |
| `npm run build` | Production build |
| `npm run lint` | ESLint via Next.js |
| `npm run db:push` | Push schema changes to Neon (no migration files) |
| `npm run db:studio` | Open Drizzle Studio to inspect the database |

## Architecture

- **Schema** — `src/lib/db/schema.ts` is the single source of truth; changes are pushed directly to Neon with `db:push` (no migration files).
- **Mutations** — all writes go through Server Actions in `src/app/actions/`.
- **Pages** — async Server Components query Drizzle directly; client components exist only where interactivity is required (outfit builder, trip checklist).
- **Design system** — custom Tailwind theme in `src/app/globals.css` with `forest`, `pewter`, and `action` color families.

## Routes

- `/gear` — gear inventory list and CRUD
- `/outfits` — outfit list, creation, and editing
- `/trips` — trip list, creation, and packing checklist
