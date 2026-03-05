# GRC Gear - Design Document

## Brainstorming Retrospective

### How We Got Here

This design was developed through a structured brainstorming session starting from a single CSV file of ~130 backpacking gear items. The CSV had already been exported from a spreadsheet and imported into Notion, but the goal was to move beyond spreadsheets entirely into a custom, data-driven solution.

### Key Decisions Made (and Why)

1. **Inspiration: lighterpack.com, but custom** - The user wanted the core concept of lighterpack (gear list + weight tracking) but with more control over UX and backend. Three specific gaps drove this: building named gear "outfits," packing checklists, and better category/hierarchy support.

2. **Standalone database over Notion API** - While the data was already in Notion, we chose Supabase (Postgres) to own the data fully. This avoids Notion API rate limits and quirks, and aligns with the learning goal of building a real data-driven app.

3. **Next.js + Supabase + Tailwind on Vercel** - Next.js is the native Vercel framework with built-in API routing. Supabase provides Postgres + client SDK with minimal setup. Tailwind keeps the UI clean without a heavy component library. This stack is beginner-friendly with strong documentation.

4. **Single-user now, multi-user later** - No auth plumbing in v1. The user will be the sole user initially. Future enhancement: friends could log in and pick gear from the inventory for shared trip planning.

5. **Outfit builder: toggle + category browse + tier quick-select** - Rather than rigid templates, the user browses gear by category and toggles items on/off. The existing tier system (1/2/3) serves as a quick-select shortcut (e.g., "select all Tier 1" for an ultralight base).

6. **Trip-based packing checklists** - Packing state (packed/charged) lives on a trip, not on the gear item or outfit. This keeps outfits reusable as templates and trips as one-time checklists that get archived after use.

7. **UI priority: clean checklist first, weight dashboard second** - Functional minimalism over flashy charts. The primary interaction is toggling and checking things off. Weight summaries are important but secondary.

---

## Architecture

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) + TypeScript |
| Database | Supabase (Postgres) |
| Styling | Tailwind CSS |
| Hosting | Vercel |

### Project Structure

```
grc-gear/
├── src/
│   ├── app/              # Next.js App Router pages
│   │   ├── gear/         # Gear inventory management
│   │   ├── outfits/      # Outfit list + builder
│   │   ├── trips/        # Trip list + packing checklist
│   │   └── layout.tsx    # Shared nav layout
│   ├── components/       # Reusable UI components
│   ├── lib/
│   │   └── supabase.ts   # Supabase client config
│   └── types/            # TypeScript types
├── supabase/
│   └── migrations/       # SQL migration files
├── scripts/
│   └── import-csv.ts     # One-time CSV import script
└── docs/
    └── plans/
```

---

## Data Model

### gear_items

Master inventory of all gear.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| name | text | e.g., "Nemo Hornet" |
| category | text | e.g., "Shelter" |
| sub_category | text | e.g., "Tents" |
| weight_oz | decimal | Weight in ounces (nullable for unweighed items) |
| tier | int | 1, 2, or 3 (nullable) |
| is_primary | boolean | Primary vs Optional |
| is_weighed | boolean | Has this item been weighed? |
| needs_charge | boolean | Requires charging before a trip? |
| parent_item_id | uuid | FK to gear_items.id (nullable) - for bag/sub-item hierarchy |
| notes | text | Nullable |
| created_at | timestamptz | |

### outfits

Named gear loadouts.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| name | text | e.g., "Summer Overnight - Ultralight" |
| description | text | Nullable |
| created_at | timestamptz | |

### outfit_items

Join table: which gear items are in which outfit.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| outfit_id | uuid | FK to outfits |
| gear_item_id | uuid | FK to gear_items |

### trips

An upcoming trip tied to an outfit.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| name | text | e.g., "Mt. Whitney June 2026" |
| outfit_id | uuid | FK to outfits |
| date | date | Trip date (nullable) |
| created_at | timestamptz | |

### trip_checklist

Per-trip packing state for each gear item in the trip's outfit.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| trip_id | uuid | FK to trips |
| gear_item_id | uuid | FK to gear_items |
| is_packed | boolean | Default false |
| is_charged | boolean | Default false (only relevant if gear_item.needs_charge) |

### Parent-Child Hierarchy

Items like "Food Bag" have sub-items (Meals, Toothbrush, etc.) linked via `parent_item_id`. When a parent bag is toggled into an outfit, its sub-items come along. Sub-items without individual weights inherit the parent's weight (the parent bag was weighed as a unit).

---

## Pages & UI

### Navigation

Minimal top nav with three links: **Gear**, **Outfits**, **Trips**. Mobile-responsive layout that stacks cleanly on phone screens.

### 1. Gear Inventory (`/gear`)

Master list of all gear, grouped by category. Each item shows:
- Name, weight (oz/lbs), tier badge, primary/optional badge
- Parent items are expandable to reveal sub-items
- Add / edit / delete functionality
- Inline editing preferred for quick weight updates

### 2. Outfits (`/outfits`)

List of saved outfits with summary stats (total weight, item count). Click to enter the builder.

### 3. Outfit Builder (`/outfits/[id]`)

The core interaction:
- Gear list organized by category/sub-category with checkboxes
- Toggle items in/out of the outfit
- Quick-select buttons: "All Tier 1", "All Primary", "Clear All"
- Running weight tally at top, broken down by category
- Weight breakdown visualization (bar chart or category summary)

### 4. Trips (`/trips`)

List of trips. Create a trip by naming it and selecting an outfit.

### 5. Trip Checklist (`/trips/[id]`)

Packing checklist generated from the trip's outfit:
- Gear items grouped by category with "packed" checkboxes
- Items with `needs_charge` get an additional "charged" checkbox
- Progress bar at top (e.g., "23/31 packed")
- Visual distinction for fully-packed categories

---

## Future Enhancements (Noted, Not Built)

- **Multi-user auth** - Users table, login flow, friends can browse gear and build shared packing lists
- **Outfit comparison** - Side-by-side view of two outfits with weight diffs
- **Trip history/notes** - Post-trip notes ("I didn't use X", "next time bring Y")
- **Wear tracking** - How many trips has this item been on?

---

## CSV Import

A one-time `scripts/import-csv.ts` script will:
1. Parse `GRC-Gear-List-Notion-Import.csv`
2. Map columns to the `gear_items` schema
3. Establish parent-child relationships based on the "sub-item of X" notes
4. Insert into Supabase

Weight conversion: CSV has both LBs and OZs columns. We'll store `weight_oz` as the canonical value.
