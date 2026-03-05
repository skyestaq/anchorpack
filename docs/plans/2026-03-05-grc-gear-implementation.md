# GRC Gear Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a backpacking gear outfit builder with gear inventory, outfit creation, and trip-based packing checklists.

**Architecture:** Next.js 15 App Router frontend with Supabase Postgres backend. Server components fetch data, client components handle interactivity. No auth in v1 — single user with Supabase anon key + RLS disabled.

**Tech Stack:** Next.js 15, TypeScript, Supabase (Postgres + JS client), Tailwind CSS, Vercel

**Design Doc:** `docs/plans/2026-03-05-grc-gear-design.md`

---

## Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `tsconfig.json`, `tailwind.config.ts`, `next.config.ts`, `src/app/layout.tsx`, `src/app/page.tsx`, `.env.local.example`, `.gitignore`

**Step 1: Scaffold Next.js project**

Run from the repo root (which already has `docs/` and the CSV):

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

Say yes to overwrite if prompted. This creates the full Next.js project in the current directory.

**Step 2: Install Supabase client**

```bash
npm install @supabase/supabase-js
```

**Step 3: Install csv-parse for the import script**

```bash
npm install -D csv-parse tsx
```

**Step 4: Create `.env.local.example`**

Create `.env.local.example` with:

```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**Step 5: Update `.gitignore`**

Ensure `.env.local` is in `.gitignore` (create-next-app should handle this, but verify).

**Step 6: Verify the app runs**

```bash
npm run dev
```

Visit `http://localhost:3000` — should see the default Next.js page.

**Step 7: Commit**

```bash
git add -A
git commit -m "scaffold: Next.js 15 + Tailwind + Supabase client"
```

---

## Task 2: Supabase Project Setup & Database Schema

**Files:**
- Create: `supabase/migrations/001_initial_schema.sql`
- Create: `src/lib/supabase.ts`
- Create: `src/types/database.ts`

**Step 1: Create Supabase project**

Go to https://supabase.com/dashboard, create a new project called "grc-gear". Copy the project URL and anon key into `.env.local`.

**Step 2: Write the migration SQL**

Create `supabase/migrations/001_initial_schema.sql`:

```sql
-- Gear items: master inventory
create table gear_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  sub_category text not null,
  weight_oz decimal,
  tier int,
  is_primary boolean not null default true,
  is_weighed boolean not null default false,
  needs_charge boolean not null default false,
  parent_item_id uuid references gear_items(id) on delete set null,
  notes text,
  created_at timestamptz not null default now()
);

-- Outfits: named gear loadouts
create table outfits (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

-- Join table: outfit <-> gear items
create table outfit_items (
  id uuid primary key default gen_random_uuid(),
  outfit_id uuid not null references outfits(id) on delete cascade,
  gear_item_id uuid not null references gear_items(id) on delete cascade,
  unique(outfit_id, gear_item_id)
);

-- Trips: tied to an outfit
create table trips (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  outfit_id uuid not null references outfits(id) on delete cascade,
  date date,
  created_at timestamptz not null default now()
);

-- Trip checklist: per-trip packing state
create table trip_checklist (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  gear_item_id uuid not null references gear_items(id) on delete cascade,
  is_packed boolean not null default false,
  is_charged boolean not null default false,
  unique(trip_id, gear_item_id)
);

-- Indexes for common queries
create index idx_gear_items_category on gear_items(category);
create index idx_gear_items_parent on gear_items(parent_item_id);
create index idx_outfit_items_outfit on outfit_items(outfit_id);
create index idx_outfit_items_gear on outfit_items(gear_item_id);
create index idx_trip_checklist_trip on trip_checklist(trip_id);
```

**Step 3: Run the migration**

Go to Supabase Dashboard > SQL Editor, paste the contents of `001_initial_schema.sql`, and run it. Verify all 5 tables appear in the Table Editor.

**Step 4: Disable RLS for now (single user)**

In the SQL Editor, run:

```sql
alter table gear_items enable row level security;
create policy "Allow all" on gear_items for all using (true) with check (true);

alter table outfits enable row level security;
create policy "Allow all" on outfits for all using (true) with check (true);

alter table outfit_items enable row level security;
create policy "Allow all" on outfit_items for all using (true) with check (true);

alter table trips enable row level security;
create policy "Allow all" on trips for all using (true) with check (true);

alter table trip_checklist enable row level security;
create policy "Allow all" on trip_checklist for all using (true) with check (true);
```

**Step 5: Create Supabase client**

Create `src/lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

**Step 6: Create TypeScript types**

Create `src/types/database.ts`:

```typescript
export interface GearItem {
  id: string
  name: string
  category: string
  sub_category: string
  weight_oz: number | null
  tier: number | null
  is_primary: boolean
  is_weighed: boolean
  needs_charge: boolean
  parent_item_id: string | null
  notes: string | null
  created_at: string
}

export interface Outfit {
  id: string
  name: string
  description: string | null
  created_at: string
}

export interface OutfitItem {
  id: string
  outfit_id: string
  gear_item_id: string
}

export interface Trip {
  id: string
  name: string
  outfit_id: string
  date: string | null
  created_at: string
}

export interface TripChecklistItem {
  id: string
  trip_id: string
  gear_item_id: string
  is_packed: boolean
  is_charged: boolean
}
```

**Step 7: Commit**

```bash
git add supabase/ src/lib/supabase.ts src/types/database.ts .env.local.example
git commit -m "feat: database schema, Supabase client, and TypeScript types"
```

---

## Task 3: CSV Import Script

**Files:**
- Create: `scripts/import-csv.ts`

**Step 1: Write the import script**

Create `scripts/import-csv.ts`:

```typescript
import { parse } from 'csv-parse/sync'
import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface CsvRow {
  'Item Name': string
  'Category': string
  'Sub-Category': string
  'LBs': string
  'OZs': string
  'Tier': string
  'Primary / Optional': string
  'Weighed': string
  'Needs Charge': string
  'Packed': string
  'Notes': string
}

async function main() {
  const csv = readFileSync('GRC-Gear-List-Notion-Import.csv', 'utf-8')
  const rows: CsvRow[] = parse(csv, { columns: true, skip_empty_lines: true })

  // First pass: identify parent items and insert all items
  const parentMap: Record<string, string> = {} // "Food Bag" -> uuid
  const pendingChildren: { name: string; parentName: string; row: CsvRow }[] = []

  for (const row of rows) {
    const notes = row['Notes']?.trim() || ''
    const needsChargeFromNotes = notes.toLowerCase().includes('needs charge')
    const needsChargeFromCol = row['Needs Charge']?.toUpperCase() === 'TRUE'

    // Parse weight - use OZs column as canonical
    let weightOz: number | null = null
    const ozVal = parseFloat(row['OZs'])
    if (!isNaN(ozVal) && ozVal > 0) {
      weightOz = ozVal
    }

    // Parse tier
    let tier: number | null = null
    const tierVal = parseInt(row['Tier'])
    if (!isNaN(tierVal)) {
      tier = tierVal
    }

    // Determine if primary
    const isPrimary = row['Primary / Optional']?.trim() === 'Primary'

    // Check if this is a sub-item
    const subItemMatch = notes.match(/sub-item of (.+)/i)
    const isParent = notes.toLowerCase().includes('parent bag')

    // Clean notes: remove "parent bag", "sub-item of X", "needs charge" metadata
    let cleanNotes = notes
      .replace(/parent bag[^,]*/i, '')
      .replace(/sub-item of [^,—]*/i, '')
      .replace(/needs charge[^,—]*/i, '')
      .replace(/[—,\s]+$/g, '')
      .replace(/^[—,\s]+/g, '')
      .trim() || null

    const item = {
      name: row['Item Name'].trim(),
      category: row['Category'].trim(),
      sub_category: row['Sub-Category'].trim(),
      weight_oz: weightOz,
      tier,
      is_primary: isPrimary,
      is_weighed: row['Weighed']?.toUpperCase() === 'TRUE',
      needs_charge: needsChargeFromCol || needsChargeFromNotes,
      parent_item_id: null as string | null,
      notes: cleanNotes,
    }

    if (subItemMatch) {
      const parentName = subItemMatch[1].trim().replace(/[—,\s]+$/, '')
      pendingChildren.push({ name: item.name, parentName, row })

      // Insert without parent_item_id for now, we'll update after
      const { data, error } = await supabase
        .from('gear_items')
        .insert(item)
        .select('id')
        .single()

      if (error) {
        console.error(`Error inserting ${item.name}:`, error.message)
        continue
      }
      console.log(`  Inserted sub-item: ${item.name} (parent: ${parentName})`)
    } else {
      const { data, error } = await supabase
        .from('gear_items')
        .insert(item)
        .select('id')
        .single()

      if (error) {
        console.error(`Error inserting ${item.name}:`, error.message)
        continue
      }

      if (isParent) {
        parentMap[item.name] = data.id
        // Also map without "(includes bag)" suffix for matching
        const shortName = item.name.replace(/\s*\(includes bag\)/i, '').trim()
        parentMap[shortName] = data.id
      }

      console.log(`Inserted: ${item.name}${isParent ? ' [PARENT]' : ''}`)
    }
  }

  // Second pass: link children to parents
  console.log('\nLinking parent-child relationships...')

  for (const child of pendingChildren) {
    const parentId = parentMap[child.parentName]
    if (!parentId) {
      console.warn(`  WARNING: No parent found for "${child.name}" (looking for "${child.parentName}")`)
      continue
    }

    const { error } = await supabase
      .from('gear_items')
      .update({ parent_item_id: parentId })
      .eq('name', child.name)

    if (error) {
      console.error(`  Error linking ${child.name}:`, error.message)
    } else {
      console.log(`  Linked: ${child.name} -> ${child.parentName}`)
    }
  }

  // Summary
  const { count } = await supabase
    .from('gear_items')
    .select('*', { count: 'exact', head: true })

  console.log(`\nDone! ${count} items imported.`)
}

main().catch(console.error)
```

**Step 2: Run the import**

```bash
npx tsx scripts/import-csv.ts
```

Expected output: ~129 items inserted, parent-child links for Food Bag, Quick Access Pack, Campsite Pack, and Clothes Bag sub-items.

**Step 3: Verify in Supabase**

Go to Supabase Dashboard > Table Editor > gear_items. Verify:
- All items present
- Parent items have sub-items linked via `parent_item_id`
- Weight values populated where available
- `needs_charge` is true for Headlamp, Charger Battery, Flextail Zero

**Step 4: Commit**

```bash
git add scripts/import-csv.ts
git commit -m "feat: CSV import script for gear inventory"
```

---

## Task 4: Shared Layout & Navigation

**Files:**
- Modify: `src/app/layout.tsx`
- Create: `src/app/page.tsx` (replace default)
- Create: `src/components/nav.tsx`

**Step 1: Create the nav component**

Create `src/components/nav.tsx`:

```typescript
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/gear', label: 'Gear' },
  { href: '/outfits', label: 'Outfits' },
  { href: '/trips', label: 'Trips' },
]

export function Nav() {
  const pathname = usePathname()

  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="flex h-14 items-center justify-between">
          <Link href="/" className="text-lg font-semibold text-gray-900">
            GRC Gear
          </Link>
          <div className="flex gap-6">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium ${
                  pathname.startsWith(link.href)
                    ? 'text-gray-900'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  )
}
```

**Step 2: Update the root layout**

Modify `src/app/layout.tsx` to use the nav:

```typescript
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Nav } from '@/components/nav'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'GRC Gear',
  description: 'Backpacking gear outfit builder',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 text-gray-900`}>
        <Nav />
        <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
          {children}
        </main>
      </body>
    </html>
  )
}
```

**Step 3: Replace the default home page**

Replace `src/app/page.tsx`:

```typescript
import Link from 'next/link'

export default function Home() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">GRC Gear</h1>
      <p className="text-gray-600">Backpacking gear outfit builder.</p>
      <div className="flex gap-4">
        <Link
          href="/gear"
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
        >
          Gear Inventory
        </Link>
        <Link
          href="/outfits"
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-100"
        >
          Outfits
        </Link>
        <Link
          href="/trips"
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-100"
        >
          Trips
        </Link>
      </div>
    </div>
  )
}
```

**Step 4: Verify**

```bash
npm run dev
```

Check that the nav renders on all pages and links work.

**Step 5: Commit**

```bash
git add src/app/layout.tsx src/app/page.tsx src/components/nav.tsx
git commit -m "feat: shared layout with navigation"
```

---

## Task 5: Gear Inventory Page (Read-Only List)

**Files:**
- Create: `src/app/gear/page.tsx`
- Create: `src/components/gear-list.tsx`

**Step 1: Create the gear list component**

Create `src/components/gear-list.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { GearItem } from '@/types/database'

function formatWeight(oz: number | null): string {
  if (oz === null || oz === 0) return '—'
  if (oz >= 16) return `${(oz / 16).toFixed(1)} lbs`
  return `${oz} oz`
}

function TierBadge({ tier }: { tier: number | null }) {
  if (!tier) return null
  const colors: Record<number, string> = {
    1: 'bg-green-100 text-green-700',
    2: 'bg-yellow-100 text-yellow-700',
    3: 'bg-red-100 text-red-700',
  }
  return (
    <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${colors[tier] || ''}`}>
      T{tier}
    </span>
  )
}

interface GearListProps {
  items: GearItem[]
}

export function GearList({ items }: GearListProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  // Group by category
  const categories = items.reduce<Record<string, GearItem[]>>((acc, item) => {
    if (!item.parent_item_id) {
      if (!acc[item.category]) acc[item.category] = []
      acc[item.category].push(item)
    }
    return acc
  }, {})

  // Map children by parent_item_id
  const childrenMap = items.reduce<Record<string, GearItem[]>>((acc, item) => {
    if (item.parent_item_id) {
      if (!acc[item.parent_item_id]) acc[item.parent_item_id] = []
      acc[item.parent_item_id].push(item)
    }
    return acc
  }, {})

  const toggleCategory = (cat: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev)
      next.has(cat) ? next.delete(cat) : next.add(cat)
      return next
    })
  }

  // Category weight total
  function categoryWeight(catItems: GearItem[]): number {
    return catItems.reduce((sum, item) => sum + (item.weight_oz || 0), 0)
  }

  return (
    <div className="space-y-4">
      {Object.entries(categories).map(([category, catItems]) => (
        <div key={category} className="rounded-lg border border-gray-200 bg-white">
          <button
            onClick={() => toggleCategory(category)}
            className="flex w-full items-center justify-between px-4 py-3 text-left"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">{category}</span>
              <span className="text-xs text-gray-500">({catItems.length} items)</span>
            </div>
            <span className="text-xs text-gray-500">
              {formatWeight(categoryWeight(catItems))}
            </span>
          </button>

          {expandedCategories.has(category) && (
            <div className="border-t border-gray-100">
              {catItems.map((item) => {
                const children = childrenMap[item.id] || []
                return (
                  <div key={item.id}>
                    <div className="flex items-center justify-between px-4 py-2 hover:bg-gray-50">
                      <div className="flex items-center gap-2">
                        {children.length > 0 && (
                          <span className="text-xs text-gray-400">+{children.length}</span>
                        )}
                        <span className="text-sm">{item.name}</span>
                        <TierBadge tier={item.tier} />
                        {!item.is_primary && (
                          <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">
                            optional
                          </span>
                        )}
                        {item.needs_charge && (
                          <span className="text-xs text-amber-500">⚡</span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">
                        {formatWeight(item.weight_oz)}
                      </span>
                    </div>
                    {children.map((child) => (
                      <div
                        key={child.id}
                        className="flex items-center justify-between py-1.5 pl-10 pr-4 text-gray-500 hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs">{child.name}</span>
                          {child.needs_charge && (
                            <span className="text-xs text-amber-500">⚡</span>
                          )}
                        </div>
                        <span className="text-xs">
                          {formatWeight(child.weight_oz)}
                        </span>
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
```

**Step 2: Create the gear page (server component)**

Create `src/app/gear/page.tsx`:

```typescript
import { supabase } from '@/lib/supabase'
import { GearList } from '@/components/gear-list'
import { GearItem } from '@/types/database'

export default async function GearPage() {
  const { data: items, error } = await supabase
    .from('gear_items')
    .select('*')
    .order('category')
    .order('sub_category')
    .order('name')

  if (error) {
    return <p className="text-red-600">Error loading gear: {error.message}</p>
  }

  const totalWeight = (items as GearItem[])
    .filter((i) => !i.parent_item_id)
    .reduce((sum, i) => sum + (i.weight_oz || 0), 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Gear Inventory</h1>
        <span className="text-sm text-gray-500">
          {items.length} items &middot; {(totalWeight / 16).toFixed(1)} lbs total
        </span>
      </div>
      <GearList items={items as GearItem[]} />
    </div>
  )
}
```

**Step 3: Verify**

```bash
npm run dev
```

Navigate to `/gear`. Should see all gear items grouped by category, expandable, with weights and badges.

**Step 4: Commit**

```bash
git add src/app/gear/ src/components/gear-list.tsx
git commit -m "feat: gear inventory page with category grouping"
```

---

## Task 6: Gear Item Add/Edit/Delete

**Files:**
- Create: `src/components/gear-form.tsx`
- Modify: `src/components/gear-list.tsx` (add edit/delete buttons)
- Create: `src/app/gear/new/page.tsx`
- Create: `src/app/gear/[id]/edit/page.tsx`

**Step 1: Create the gear form component**

Create `src/components/gear-form.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { GearItem } from '@/types/database'

interface GearFormProps {
  item?: GearItem
  parentItems: Pick<GearItem, 'id' | 'name'>[]
}

export function GearForm({ item, parentItems }: GearFormProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)

    const form = new FormData(e.currentTarget)
    const data = {
      name: form.get('name') as string,
      category: form.get('category') as string,
      sub_category: form.get('sub_category') as string,
      weight_oz: form.get('weight_oz') ? parseFloat(form.get('weight_oz') as string) : null,
      tier: form.get('tier') ? parseInt(form.get('tier') as string) : null,
      is_primary: form.get('is_primary') === 'on',
      is_weighed: form.get('is_weighed') === 'on',
      needs_charge: form.get('needs_charge') === 'on',
      parent_item_id: (form.get('parent_item_id') as string) || null,
      notes: (form.get('notes') as string) || null,
    }

    if (item) {
      await supabase.from('gear_items').update(data).eq('id', item.id)
    } else {
      await supabase.from('gear_items').insert(data)
    }

    router.push('/gear')
    router.refresh()
  }

  async function handleDelete() {
    if (!item || !confirm('Delete this item?')) return
    await supabase.from('gear_items').delete().eq('id', item.id)
    router.push('/gear')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
      <div>
        <label className="block text-sm font-medium">Name</label>
        <input
          name="name"
          defaultValue={item?.name}
          required
          className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Category</label>
          <input
            name="category"
            defaultValue={item?.category}
            required
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Sub-Category</label>
          <input
            name="sub_category"
            defaultValue={item?.sub_category}
            required
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Weight (oz)</label>
          <input
            name="weight_oz"
            type="number"
            step="0.01"
            defaultValue={item?.weight_oz ?? ''}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Tier</label>
          <select
            name="tier"
            defaultValue={item?.tier ?? ''}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">None</option>
            <option value="1">Tier 1</option>
            <option value="2">Tier 2</option>
            <option value="3">Tier 3</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium">Parent Item</label>
        <select
          name="parent_item_id"
          defaultValue={item?.parent_item_id ?? ''}
          className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">None (top-level item)</option>
          {parentItems.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="is_primary" defaultChecked={item?.is_primary ?? true} />
          Primary
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="is_weighed" defaultChecked={item?.is_weighed ?? false} />
          Weighed
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="needs_charge" defaultChecked={item?.needs_charge ?? false} />
          Needs Charge
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium">Notes</label>
        <textarea
          name="notes"
          defaultValue={item?.notes ?? ''}
          rows={2}
          className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : item ? 'Update' : 'Add Item'}
        </button>
        {item && (
          <button
            type="button"
            onClick={handleDelete}
            className="rounded border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            Delete
          </button>
        )}
      </div>
    </form>
  )
}
```

**Step 2: Create add and edit pages**

Create `src/app/gear/new/page.tsx`:

```typescript
import { supabase } from '@/lib/supabase'
import { GearForm } from '@/components/gear-form'

export default async function NewGearPage() {
  // Fetch potential parent items (items that already have children or are parent bags)
  const { data: parents } = await supabase
    .from('gear_items')
    .select('id, name')
    .is('parent_item_id', null)
    .order('name')

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Add Gear Item</h1>
      <GearForm parentItems={parents || []} />
    </div>
  )
}
```

Create `src/app/gear/[id]/edit/page.tsx`:

```typescript
import { supabase } from '@/lib/supabase'
import { GearForm } from '@/components/gear-form'
import { GearItem } from '@/types/database'
import { notFound } from 'next/navigation'

export default async function EditGearPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { data: item } = await supabase
    .from('gear_items')
    .select('*')
    .eq('id', id)
    .single()

  if (!item) notFound()

  const { data: parents } = await supabase
    .from('gear_items')
    .select('id, name')
    .is('parent_item_id', null)
    .neq('id', id)
    .order('name')

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Edit: {(item as GearItem).name}</h1>
      <GearForm item={item as GearItem} parentItems={parents || []} />
    </div>
  )
}
```

**Step 3: Add edit link to gear list**

Modify `src/components/gear-list.tsx` — add a Link import and wrap each item name in a link:

In the item row, change `<span className="text-sm">{item.name}</span>` to:

```typescript
<Link href={`/gear/${item.id}/edit`} className="text-sm hover:underline">
  {item.name}
</Link>
```

Add import at top: `import Link from 'next/link'`

Also add an "Add Item" button to the gear page by modifying `src/app/gear/page.tsx` — add a Link to `/gear/new` next to the heading.

**Step 4: Verify**

```bash
npm run dev
```

Test: add a new item, edit an existing item, delete an item.

**Step 5: Commit**

```bash
git add src/components/gear-form.tsx src/app/gear/ src/components/gear-list.tsx
git commit -m "feat: gear item add, edit, and delete"
```

---

## Task 7: Outfits List Page

**Files:**
- Create: `src/app/outfits/page.tsx`
- Create: `src/components/outfit-card.tsx`

**Step 1: Create the outfit card component**

Create `src/components/outfit-card.tsx`:

```typescript
import Link from 'next/link'

interface OutfitCardProps {
  id: string
  name: string
  description: string | null
  itemCount: number
  totalWeightOz: number
}

export function OutfitCard({ id, name, description, itemCount, totalWeightOz }: OutfitCardProps) {
  return (
    <Link
      href={`/outfits/${id}`}
      className="block rounded-lg border border-gray-200 bg-white p-4 hover:border-gray-300 hover:shadow-sm"
    >
      <h3 className="font-semibold">{name}</h3>
      {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
      <div className="mt-2 flex gap-4 text-xs text-gray-500">
        <span>{itemCount} items</span>
        <span>{(totalWeightOz / 16).toFixed(1)} lbs</span>
      </div>
    </Link>
  )
}
```

**Step 2: Create the outfits page**

Create `src/app/outfits/page.tsx`:

```typescript
import { supabase } from '@/lib/supabase'
import { OutfitCard } from '@/components/outfit-card'
import Link from 'next/link'

export default async function OutfitsPage() {
  const { data: outfits } = await supabase
    .from('outfits')
    .select(`
      id,
      name,
      description,
      outfit_items (
        gear_item_id,
        gear_items:gear_item_id ( weight_oz )
      )
    `)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Outfits</h1>
        <Link
          href="/outfits/new"
          className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
        >
          New Outfit
        </Link>
      </div>

      {!outfits || outfits.length === 0 ? (
        <p className="text-sm text-gray-500">No outfits yet. Create one to get started.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {outfits.map((outfit: any) => {
            const items = outfit.outfit_items || []
            const totalWeight = items.reduce(
              (sum: number, oi: any) => sum + (oi.gear_items?.weight_oz || 0),
              0
            )
            return (
              <OutfitCard
                key={outfit.id}
                id={outfit.id}
                name={outfit.name}
                description={outfit.description}
                itemCount={items.length}
                totalWeightOz={totalWeight}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
```

**Step 3: Commit**

```bash
git add src/app/outfits/ src/components/outfit-card.tsx
git commit -m "feat: outfits list page with weight summaries"
```

---

## Task 8: Outfit Builder (Create & Edit)

**Files:**
- Create: `src/app/outfits/new/page.tsx`
- Create: `src/app/outfits/[id]/page.tsx`
- Create: `src/components/outfit-builder.tsx`

**Step 1: Create the outfit builder component**

Create `src/components/outfit-builder.tsx`:

```typescript
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { GearItem } from '@/types/database'

interface OutfitBuilderProps {
  outfitId?: string
  outfitName?: string
  outfitDescription?: string
  allItems: GearItem[]
  selectedItemIds: Set<string>
}

function formatWeight(oz: number): string {
  if (oz >= 16) return `${(oz / 16).toFixed(1)} lbs`
  return `${oz.toFixed(1)} oz`
}

export function OutfitBuilder({
  outfitId,
  outfitName = '',
  outfitDescription = '',
  allItems,
  selectedItemIds: initialSelected,
}: OutfitBuilderProps) {
  const router = useRouter()
  const [name, setName] = useState(outfitName)
  const [description, setDescription] = useState(outfitDescription)
  const [selected, setSelected] = useState<Set<string>>(initialSelected)
  const [saving, setSaving] = useState(false)

  // Group top-level items by category
  const topLevel = allItems.filter((i) => !i.parent_item_id)
  const categories = topLevel.reduce<Record<string, GearItem[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = []
    acc[item.category].push(item)
    return acc
  }, {})

  // Children map
  const childrenMap = allItems.reduce<Record<string, GearItem[]>>((acc, item) => {
    if (item.parent_item_id) {
      if (!acc[item.parent_item_id]) acc[item.parent_item_id] = []
      acc[item.parent_item_id].push(item)
    }
    return acc
  }, {})

  function toggleItem(itemId: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      const item = allItems.find((i) => i.id === itemId)
      if (!item) return next

      if (next.has(itemId)) {
        next.delete(itemId)
        // Remove children too
        ;(childrenMap[itemId] || []).forEach((c) => next.delete(c.id))
      } else {
        next.add(itemId)
        // Add children too
        ;(childrenMap[itemId] || []).forEach((c) => next.add(c.id))
      }
      return next
    })
  }

  function quickSelect(filter: 'tier1' | 'primary' | 'clear') {
    if (filter === 'clear') {
      setSelected(new Set())
      return
    }

    const ids = new Set<string>()
    allItems.forEach((item) => {
      if (filter === 'tier1' && item.tier === 1) ids.add(item.id)
      if (filter === 'primary' && item.is_primary) ids.add(item.id)
    })
    setSelected(ids)
  }

  // Calculate weights
  const selectedItems = allItems.filter((i) => selected.has(i.id) && !i.parent_item_id)
  const totalWeightOz = selectedItems.reduce((sum, i) => sum + (i.weight_oz || 0), 0)

  const categoryWeights = selectedItems.reduce<Record<string, number>>((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + (item.weight_oz || 0)
    return acc
  }, {})

  async function handleSave() {
    if (!name.trim()) return
    setSaving(true)

    let id = outfitId

    if (id) {
      await supabase.from('outfits').update({ name, description: description || null }).eq('id', id)
      await supabase.from('outfit_items').delete().eq('outfit_id', id)
    } else {
      const { data } = await supabase
        .from('outfits')
        .insert({ name, description: description || null })
        .select('id')
        .single()
      id = data?.id
    }

    if (id && selected.size > 0) {
      const rows = Array.from(selected).map((gear_item_id) => ({
        outfit_id: id!,
        gear_item_id,
      }))
      await supabase.from('outfit_items').insert(rows)
    }

    router.push('/outfits')
    router.refresh()
  }

  async function handleDelete() {
    if (!outfitId || !confirm('Delete this outfit?')) return
    await supabase.from('outfits').delete().eq('id', outfitId)
    router.push('/outfits')
    router.refresh()
  }

  return (
    <div className="space-y-6">
      {/* Name & Description */}
      <div className="space-y-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Outfit name..."
          className="w-full rounded border border-gray-300 px-3 py-2 text-lg font-semibold"
        />
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)"
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      {/* Weight Summary */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-medium">Total Weight</span>
          <span className="text-2xl font-bold">{formatWeight(totalWeightOz)}</span>
        </div>
        <div className="mt-2 flex flex-wrap gap-3">
          {Object.entries(categoryWeights).map(([cat, oz]) => (
            <span key={cat} className="text-xs text-gray-500">
              {cat}: {formatWeight(oz)}
            </span>
          ))}
        </div>
        <div className="mt-2 text-xs text-gray-500">
          {selected.size} items selected
        </div>
      </div>

      {/* Quick Select */}
      <div className="flex gap-2">
        <button
          onClick={() => quickSelect('tier1')}
          className="rounded border border-gray-300 px-3 py-1.5 text-xs font-medium hover:bg-gray-100"
        >
          All Tier 1
        </button>
        <button
          onClick={() => quickSelect('primary')}
          className="rounded border border-gray-300 px-3 py-1.5 text-xs font-medium hover:bg-gray-100"
        >
          All Primary
        </button>
        <button
          onClick={() => quickSelect('clear')}
          className="rounded border border-gray-300 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
        >
          Clear All
        </button>
      </div>

      {/* Gear Selection by Category */}
      {Object.entries(categories).map(([category, catItems]) => (
        <div key={category} className="rounded-lg border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-4 py-2">
            <span className="text-sm font-semibold">{category}</span>
          </div>
          <div>
            {catItems.map((item) => {
              const children = childrenMap[item.id] || []
              const isSelected = selected.has(item.id)
              return (
                <div key={item.id}>
                  <label className="flex cursor-pointer items-center justify-between px-4 py-2 hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleItem(item.id)}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">{item.name}</span>
                      {item.tier && (
                        <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${
                          item.tier === 1 ? 'bg-green-100 text-green-700' :
                          item.tier === 2 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          T{item.tier}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {item.weight_oz ? formatWeight(item.weight_oz) : '—'}
                    </span>
                  </label>
                  {isSelected && children.length > 0 && children.map((child) => (
                    <div key={child.id} className="flex items-center gap-3 py-1.5 pl-11 pr-4 text-gray-500">
                      <span className="text-xs">{child.name}</span>
                      {child.needs_charge && <span className="text-xs text-amber-500">⚡</span>}
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {/* Save / Delete */}
      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={saving || !name.trim()}
          className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : outfitId ? 'Update Outfit' : 'Create Outfit'}
        </button>
        {outfitId && (
          <button
            onClick={handleDelete}
            className="rounded border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  )
}
```

**Step 2: Create the new outfit page**

Create `src/app/outfits/new/page.tsx`:

```typescript
import { supabase } from '@/lib/supabase'
import { OutfitBuilder } from '@/components/outfit-builder'
import { GearItem } from '@/types/database'

export default async function NewOutfitPage() {
  const { data: items } = await supabase
    .from('gear_items')
    .select('*')
    .order('category')
    .order('sub_category')
    .order('name')

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">New Outfit</h1>
      <OutfitBuilder allItems={(items || []) as GearItem[]} selectedItemIds={new Set()} />
    </div>
  )
}
```

**Step 3: Create the edit outfit page**

Create `src/app/outfits/[id]/page.tsx`:

```typescript
import { supabase } from '@/lib/supabase'
import { OutfitBuilder } from '@/components/outfit-builder'
import { GearItem, Outfit } from '@/types/database'
import { notFound } from 'next/navigation'

export default async function EditOutfitPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { data: outfit } = await supabase
    .from('outfits')
    .select('*')
    .eq('id', id)
    .single()

  if (!outfit) notFound()

  const { data: items } = await supabase
    .from('gear_items')
    .select('*')
    .order('category')
    .order('sub_category')
    .order('name')

  const { data: outfitItems } = await supabase
    .from('outfit_items')
    .select('gear_item_id')
    .eq('outfit_id', id)

  const selectedIds = new Set((outfitItems || []).map((oi: any) => oi.gear_item_id))

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Edit Outfit</h1>
      <OutfitBuilder
        outfitId={id}
        outfitName={(outfit as Outfit).name}
        outfitDescription={(outfit as Outfit).description || ''}
        allItems={(items || []) as GearItem[]}
        selectedItemIds={selectedIds}
      />
    </div>
  )
}
```

**Step 4: Verify**

```bash
npm run dev
```

Test: create a new outfit, toggle items, use quick-select buttons, save, edit, delete.

**Step 5: Commit**

```bash
git add src/app/outfits/ src/components/outfit-builder.tsx
git commit -m "feat: outfit builder with toggle, quick-select, and weight tally"
```

---

## Task 9: Trips List Page

**Files:**
- Create: `src/app/trips/page.tsx`
- Create: `src/app/trips/new/page.tsx`
- Create: `src/components/trip-form.tsx`

**Step 1: Create the trip form component**

Create `src/components/trip-form.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Outfit } from '@/types/database'

interface TripFormProps {
  outfits: Outfit[]
}

export function TripForm({ outfits }: TripFormProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)

    const form = new FormData(e.currentTarget)
    const name = form.get('name') as string
    const outfitId = form.get('outfit_id') as string
    const date = (form.get('date') as string) || null

    // Create the trip
    const { data: trip } = await supabase
      .from('trips')
      .insert({ name, outfit_id: outfitId, date })
      .select('id')
      .single()

    if (trip) {
      // Populate checklist from outfit items
      const { data: outfitItems } = await supabase
        .from('outfit_items')
        .select('gear_item_id')
        .eq('outfit_id', outfitId)

      if (outfitItems && outfitItems.length > 0) {
        const checklistRows = outfitItems.map((oi: any) => ({
          trip_id: trip.id,
          gear_item_id: oi.gear_item_id,
          is_packed: false,
          is_charged: false,
        }))
        await supabase.from('trip_checklist').insert(checklistRows)
      }

      router.push(`/trips/${trip.id}`)
      router.refresh()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
      <div>
        <label className="block text-sm font-medium">Trip Name</label>
        <input
          name="name"
          required
          placeholder="e.g., Mt. Whitney June 2026"
          className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Outfit</label>
        <select
          name="outfit_id"
          required
          className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">Select an outfit...</option>
          {outfits.map((o) => (
            <option key={o.id} value={o.id}>{o.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium">Date</label>
        <input
          name="date"
          type="date"
          className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <button
        type="submit"
        disabled={saving}
        className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
      >
        {saving ? 'Creating...' : 'Create Trip'}
      </button>
    </form>
  )
}
```

**Step 2: Create the trips list page**

Create `src/app/trips/page.tsx`:

```typescript
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default async function TripsPage() {
  const { data: trips } = await supabase
    .from('trips')
    .select(`
      id,
      name,
      date,
      outfits:outfit_id ( name )
    `)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Trips</h1>
        <Link
          href="/trips/new"
          className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
        >
          New Trip
        </Link>
      </div>

      {!trips || trips.length === 0 ? (
        <p className="text-sm text-gray-500">No trips yet. Create one to start packing.</p>
      ) : (
        <div className="space-y-2">
          {trips.map((trip: any) => (
            <Link
              key={trip.id}
              href={`/trips/${trip.id}`}
              className="block rounded-lg border border-gray-200 bg-white p-4 hover:border-gray-300 hover:shadow-sm"
            >
              <h3 className="font-semibold">{trip.name}</h3>
              <div className="mt-1 flex gap-4 text-xs text-gray-500">
                {trip.outfits && <span>Outfit: {trip.outfits.name}</span>}
                {trip.date && <span>{trip.date}</span>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
```

**Step 3: Create the new trip page**

Create `src/app/trips/new/page.tsx`:

```typescript
import { supabase } from '@/lib/supabase'
import { TripForm } from '@/components/trip-form'
import { Outfit } from '@/types/database'

export default async function NewTripPage() {
  const { data: outfits } = await supabase
    .from('outfits')
    .select('*')
    .order('name')

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">New Trip</h1>
      <TripForm outfits={(outfits || []) as Outfit[]} />
    </div>
  )
}
```

**Step 4: Commit**

```bash
git add src/app/trips/ src/components/trip-form.tsx
git commit -m "feat: trips list page and trip creation from outfits"
```

---

## Task 10: Trip Packing Checklist

**Files:**
- Create: `src/app/trips/[id]/page.tsx`
- Create: `src/components/trip-checklist.tsx`

**Step 1: Create the trip checklist component**

Create `src/components/trip-checklist.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { GearItem, TripChecklistItem } from '@/types/database'

interface ChecklistEntry {
  checklist: TripChecklistItem
  gear: GearItem
}

interface TripChecklistProps {
  tripId: string
  tripName: string
  entries: ChecklistEntry[]
}

export function TripChecklist({ tripId, tripName, entries }: TripChecklistProps) {
  const router = useRouter()
  const [items, setItems] = useState(entries)

  // Group by category
  const categories = items.reduce<Record<string, ChecklistEntry[]>>((acc, entry) => {
    const cat = entry.gear.category
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(entry)
    return acc
  }, {})

  const totalItems = items.length
  const packedCount = items.filter((e) => e.checklist.is_packed).length
  const chargeNeeded = items.filter((e) => e.gear.needs_charge)
  const chargedCount = chargeNeeded.filter((e) => e.checklist.is_charged).length

  async function togglePacked(checklistId: string) {
    const entry = items.find((e) => e.checklist.id === checklistId)
    if (!entry) return

    const newValue = !entry.checklist.is_packed
    await supabase
      .from('trip_checklist')
      .update({ is_packed: newValue })
      .eq('id', checklistId)

    setItems((prev) =>
      prev.map((e) =>
        e.checklist.id === checklistId
          ? { ...e, checklist: { ...e.checklist, is_packed: newValue } }
          : e
      )
    )
  }

  async function toggleCharged(checklistId: string) {
    const entry = items.find((e) => e.checklist.id === checklistId)
    if (!entry) return

    const newValue = !entry.checklist.is_charged
    await supabase
      .from('trip_checklist')
      .update({ is_charged: newValue })
      .eq('id', checklistId)

    setItems((prev) =>
      prev.map((e) =>
        e.checklist.id === checklistId
          ? { ...e, checklist: { ...e.checklist, is_charged: newValue } }
          : e
      )
    )
  }

  async function handleDelete() {
    if (!confirm('Delete this trip?')) return
    await supabase.from('trips').delete().eq('id', tripId)
    router.push('/trips')
    router.refresh()
  }

  const progressPercent = totalItems > 0 ? Math.round((packedCount / totalItems) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-medium">Packing Progress</span>
          <span className="text-lg font-bold">{packedCount}/{totalItems} packed</span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className={`h-full rounded-full transition-all ${
              progressPercent === 100 ? 'bg-green-500' : 'bg-gray-900'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        {chargeNeeded.length > 0 && (
          <div className="mt-2 text-xs text-amber-600">
            ⚡ {chargedCount}/{chargeNeeded.length} charged
          </div>
        )}
      </div>

      {/* Checklist by Category */}
      {Object.entries(categories).map(([category, catEntries]) => {
        const catPacked = catEntries.filter((e) => e.checklist.is_packed).length
        const allPacked = catPacked === catEntries.length
        return (
          <div
            key={category}
            className={`rounded-lg border bg-white ${
              allPacked ? 'border-green-200 bg-green-50' : 'border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2">
              <span className="text-sm font-semibold">{category}</span>
              <span className="text-xs text-gray-500">{catPacked}/{catEntries.length}</span>
            </div>
            <div>
              {catEntries.map((entry) => (
                <div
                  key={entry.checklist.id}
                  className="flex items-center justify-between px-4 py-2 hover:bg-gray-50"
                >
                  <label className="flex cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      checked={entry.checklist.is_packed}
                      onChange={() => togglePacked(entry.checklist.id)}
                      className="rounded border-gray-300"
                    />
                    <span
                      className={`text-sm ${
                        entry.checklist.is_packed ? 'text-gray-400 line-through' : ''
                      }`}
                    >
                      {entry.gear.name}
                    </span>
                  </label>
                  {entry.gear.needs_charge && (
                    <button
                      onClick={() => toggleCharged(entry.checklist.id)}
                      className={`rounded px-2 py-1 text-xs font-medium ${
                        entry.checklist.is_charged
                          ? 'bg-green-100 text-green-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {entry.checklist.is_charged ? '⚡ Charged' : '⚡ Charge'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      })}

      {/* Delete Trip */}
      <button
        onClick={handleDelete}
        className="rounded border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
      >
        Delete Trip
      </button>
    </div>
  )
}
```

**Step 2: Create the trip detail page**

Create `src/app/trips/[id]/page.tsx`:

```typescript
import { supabase } from '@/lib/supabase'
import { TripChecklist } from '@/components/trip-checklist'
import { GearItem, Trip, TripChecklistItem } from '@/types/database'
import { notFound } from 'next/navigation'

export default async function TripPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { data: trip } = await supabase
    .from('trips')
    .select('*')
    .eq('id', id)
    .single()

  if (!trip) notFound()

  const { data: checklistItems } = await supabase
    .from('trip_checklist')
    .select(`
      id,
      trip_id,
      gear_item_id,
      is_packed,
      is_charged,
      gear_items:gear_item_id (
        id, name, category, sub_category, weight_oz, tier,
        is_primary, is_weighed, needs_charge, parent_item_id, notes, created_at
      )
    `)
    .eq('trip_id', id)
    .order('gear_item_id')

  const entries = (checklistItems || []).map((ci: any) => ({
    checklist: {
      id: ci.id,
      trip_id: ci.trip_id,
      gear_item_id: ci.gear_item_id,
      is_packed: ci.is_packed,
      is_charged: ci.is_charged,
    } as TripChecklistItem,
    gear: ci.gear_items as GearItem,
  }))

  // Sort by category then name
  entries.sort((a: any, b: any) => {
    const catCmp = a.gear.category.localeCompare(b.gear.category)
    if (catCmp !== 0) return catCmp
    return a.gear.name.localeCompare(b.gear.name)
  })

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">{(trip as Trip).name}</h1>
        {(trip as Trip).date && (
          <p className="text-sm text-gray-500">{(trip as Trip).date}</p>
        )}
      </div>
      <TripChecklist
        tripId={id}
        tripName={(trip as Trip).name}
        entries={entries}
      />
    </div>
  )
}
```

**Step 3: Verify**

```bash
npm run dev
```

Test full flow: create outfit -> create trip from outfit -> pack items via checklist -> verify progress bar updates.

**Step 4: Commit**

```bash
git add src/app/trips/ src/components/trip-checklist.tsx
git commit -m "feat: trip packing checklist with progress tracking"
```

---

## Task 11: Deploy to Vercel

**Step 1: Create GitHub repo**

```bash
gh repo create grc-gear --private --source=. --push
```

(Or create manually on GitHub and push.)

**Step 2: Connect to Vercel**

Go to https://vercel.com/new, import the GitHub repo. Add environment variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Deploy.

**Step 3: Verify**

Visit the Vercel URL and test all pages work with the live Supabase database.

**Step 4: Commit any deploy config changes**

```bash
git add -A
git commit -m "chore: vercel deployment"
```
