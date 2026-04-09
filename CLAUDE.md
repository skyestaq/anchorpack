# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server at localhost:3000
npm run build        # Production build
npm run lint         # ESLint via Next.js
npm run db:push      # Push schema changes to Neon (no migration files)
npm run db:studio    # Open Drizzle Studio to inspect database
```

Requires `DATABASE_URL` in `.env.local` pointing to a Neon PostgreSQL instance.

## Architecture

AnchorPack is a **Next.js 16 App Router** app for managing backpacking gear. No tests exist yet.

### Data flow
All mutations go through **Next.js Server Actions** (`src/app/actions/`). Pages are async Server Components that query the database directly via Drizzle ORM. Client components (`'use client'`) exist only where interactivity is required (outfit builder, trip checklist).

### Database
- **Neon PostgreSQL** via `@neondatabase/serverless` + Drizzle ORM
- Schema: `src/lib/db/schema.ts` — single source of truth
- DB client: `src/lib/db/index.ts` — exports `db`
- Types: `src/types/database.ts` — all types inferred from schema via `InferSelectModel`
- Schema changes: edit `schema.ts` then run `npm run db:push` (no migration files generated)

### Domain model
- **GearItem** — individual piece of gear with category, subCategory, weightOz, tier (1–3), manufacturer, and flags (isPrimary, isWeighed, needsCharge). Supports parent/child relationships via `parentItemId`.
- **Outfit** — a named gear loadout; many-to-many with GearItems via `outfitItems` junction table.
- **Trip** — references an Outfit. Creating a trip auto-populates `tripChecklist` from the outfit's gear items. Checklist tracks `isPacked` and `isCharged` per item.

### Key routes
- `/gear` — gear inventory list and CRUD
- `/outfits` — outfit list; `/outfits/new` and `/outfits/[id]` for builder
- `/trips` — trip list; `/trips/new` and `/trips/[id]` for checklist

### Design system
Tailwind v4 with custom theme defined in `src/app/globals.css`:
- Colors: `forest` (dark green), `pewter` (dark brown-gray), `action` (lime green `#69BE28`)
- Fonts: `font-display` (Krona One), `font-body` (DM Sans), `font-data` (DM Mono)
- Background is `pewter` (`#34302B`), text is `pewter-pale` (`#B1BABF`)
