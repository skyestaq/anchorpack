# Outfit Builder Category Rail — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a sticky left rail to the Outfit Builder for navigating and filtering by gear category.

**Architecture:** One new presentational component (`CategoryRail`) + targeted modifications to `OutfitBuilder` for state, layout, and an IntersectionObserver-based scrollspy. No server-side or schema changes.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind CSS v4, TypeScript.

**Spec:** `docs/superpowers/specs/2026-04-09-outfit-builder-category-rail-design.md`

**Verification approach:** This codebase has no test framework. Each task uses manual browser verification: start `npm run dev`, navigate to an existing outfit, observe behavior. The verification commands assume an outfit ID is available; substitute your own UUID for `<OUTFIT_ID>` in the URLs.

---

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `src/components/category-rail.tsx` | Create | Stateless presentational rail. Renders one row per category with name, selected/total count, focus icon. Calls back to parent for jump-to and filter actions. |
| `src/components/outfit-builder.tsx` | Modify | Add `filterCategory` and `visibleCategory` state, compute category entries, set up IntersectionObserver, wrap gear list in two-column layout with rail, filter gear cards, render dismissable chip. |

---

## Task 1: Create CategoryRail and wire into OutfitBuilder layout

Goal: rail is visible at md+, hidden below md, shows correct counts. No interaction yet — clicking rail rows does nothing.

**Files:**
- Create: `src/components/category-rail.tsx`
- Modify: `src/components/outfit-builder.tsx`

- [ ] **Step 1: Manual verification (red state)**

Run: `npm run dev`
Navigate to: `http://localhost:3000/outfits/<OUTFIT_ID>`
Expected: Standard outfit edit page. No left rail. Long single-column gear list. This is the baseline.

- [ ] **Step 2: Create the CategoryRail component**

Create `src/components/category-rail.tsx` with this exact content:

```tsx
'use client'

export interface CategoryEntry {
  name: string
  total: number
  selected: number
}

interface CategoryRailProps {
  categories: CategoryEntry[]
  filterCategory: string | null
  visibleCategory: string | null
  onJumpTo: (category: string) => void
  onToggleFilter: (category: string) => void
}

export function CategoryRail({
  categories,
  filterCategory,
  visibleCategory,
  onJumpTo,
  onToggleFilter,
}: CategoryRailProps) {
  return (
    <nav
      aria-label="Gear categories"
      className="hidden md:block w-40 shrink-0 sticky top-4 self-start max-h-[calc(100vh-2rem)] overflow-y-auto rounded-lg border border-pewter-mid bg-pewter-light"
    >
      <ul>
        {categories.map((cat) => {
          const isFiltered = filterCategory === cat.name
          const isVisible = visibleCategory === cat.name && filterCategory === null
          return (
            <li
              key={cat.name}
              className="flex items-stretch border-b border-pewter-mid last:border-b-0"
            >
              <button
                type="button"
                onClick={() => onJumpTo(cat.name)}
                className={`flex-1 text-left px-3 py-2 text-xs hover:bg-pewter transition-colors ${
                  isVisible ? 'text-white font-medium' : 'text-pewter-pale'
                }`}
              >
                <div>{cat.name}</div>
                <div className="font-data text-[10px] text-pewter-mid mt-0.5">
                  {cat.selected}/{cat.total}
                </div>
              </button>
              <button
                type="button"
                onClick={() => onToggleFilter(cat.name)}
                aria-label={
                  isFiltered ? `Stop filtering by ${cat.name}` : `Filter to ${cat.name}`
                }
                title={isFiltered ? 'Show all categories' : `Focus on ${cat.name}`}
                className={`px-2 text-base flex items-center ${
                  isFiltered
                    ? 'text-action'
                    : 'text-pewter-mid hover:text-pewter-pale'
                }`}
              >
                {isFiltered ? '◉' : '○'}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
```

- [ ] **Step 3: Modify OutfitBuilder — add import and category entries**

In `src/components/outfit-builder.tsx`, add the import alongside the existing imports:

```tsx
import { CategoryRail, type CategoryEntry } from './category-rail'
```

Then, immediately after the existing `childrenMap` reduce (around line 54), add the derived `categoryEntries` array:

```tsx
const categoryEntries: CategoryEntry[] = Object.entries(categories).map(
  ([name, items]) => ({
    name,
    total: items.length,
    selected: items.filter((i) => selected.has(i.id)).length,
  })
)
```

- [ ] **Step 4: Modify OutfitBuilder — wrap gear list in two-column layout with rail**

In `src/components/outfit-builder.tsx`, locate the existing block that renders gear cards:

```tsx
{/* Gear by Category */}
{Object.entries(categories).map(([category, catItems]) => (
  <div key={category} className="overflow-hidden rounded-lg border border-pewter-mid bg-pewter-light">
    ...
  </div>
))}
```

Replace it with this wrapped version:

```tsx
{/* Gear by Category with rail */}
<div className="md:flex md:gap-4">
  <CategoryRail
    categories={categoryEntries}
    filterCategory={null}
    visibleCategory={null}
    onJumpTo={() => {}}
    onToggleFilter={() => {}}
  />
  <div className="flex-1 min-w-0 space-y-4">
    {Object.entries(categories).map(([category, catItems]) => (
      <div
        id={`cat-${category}`}
        key={category}
        data-category-section={category}
        className="overflow-hidden rounded-lg border border-pewter-mid bg-pewter-light scroll-mt-4"
      >
        <div className="border-b border-pewter-mid px-4 py-2">
          <span className="text-sm font-medium text-white">{category}</span>
        </div>
        <div>
          {catItems.map((item) => {
            const children = childrenMap[item.id] ?? []
            const isChecked = selected.has(item.id)
            return (
              <div key={item.id}>
                <label className={`flex cursor-pointer items-center justify-between px-4 py-2.5 hover:bg-pewter transition-colors border-l-2 ${item.isPrimary ? 'border-action' : 'border-forest-light'}`}>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleItem(item.id)}
                      className="h-4 w-4 rounded accent-action"
                    />
                    <span className="text-sm text-white">{displayName(item)}</span>
                    {item.tier && (
                      <span className={`font-data rounded px-1.5 py-0.5 text-xs font-medium ${
                        item.tier === 1 ? 'bg-action text-forest-dark' :
                        item.tier === 2 ? 'bg-forest text-white' :
                        'bg-pewter-mid text-white'
                      }`}>
                        T{item.tier}
                      </span>
                    )}
                    {!item.isPrimary && (
                      <span className="font-data rounded bg-pewter-mid px-1.5 py-0.5 text-xs text-pewter-pale">optional</span>
                    )}
                  </div>
                  <span className="ml-2 shrink-0 font-data text-xs text-pewter-pale">
                    {item.weightOz ? `${parseFloat(String(item.weightOz))} oz` : '—'}
                  </span>
                </label>
                {isChecked && children.length > 0 && (
                  <div className="border-t border-pewter-mid pb-1">
                    {children.map((child) => (
                      <div key={child.id} className="flex items-center gap-2 py-1 pl-11 pr-4 text-pewter-pale">
                        <span className="text-xs">&#x21B3; {displayName(child)}</span>
                        {child.needsCharge && <span className="text-xs text-action">&#x26A1;</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    ))}
  </div>
</div>
```

Note: the existing inner JSX for each gear card is preserved verbatim. The only additions are: the wrapper `<div className="md:flex md:gap-4">`, the `<CategoryRail>` element, the wrapping right-column div, and three new attributes on the gear card div (`id={\`cat-${category}\`}`, `data-category-section={category}`, and `scroll-mt-4` appended to className).

- [ ] **Step 5: Run typecheck**

Run: `npx tsc --noEmit`
Expected: No errors. If there are errors, fix them before proceeding.

- [ ] **Step 6: Manual verification (green state — visual)**

Run: `npm run dev` (if not already running)
Navigate to: `http://localhost:3000/outfits/<OUTFIT_ID>`
Expected on viewport ≥768px:
- A left column with all 12 categories appears next to the gear list
- Each row shows the category name and `selected/total` count (e.g., "Backpack 5/21")
- The focus icon (○) is visible on the right of each row but unfilled
- The gear list is now narrower but still fully readable
- Toggle a checkbox in any category — the rail count for that category updates immediately

Resize browser to <768px:
- The rail disappears
- Gear list returns to full width

- [ ] **Step 7: Commit**

```bash
git add src/components/category-rail.tsx src/components/outfit-builder.tsx
git commit -m "feat: add CategoryRail component to outfit builder layout

Adds a presentational sticky left rail showing all gear categories with
live selected/total counts. Visible at md+ breakpoints, hidden below.
No interaction wired yet — jump-to and filter come in subsequent commits.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Implement jump-to scrolling

Goal: clicking a category name in the rail smooth-scrolls that section into view.

**Files:**
- Modify: `src/components/outfit-builder.tsx`

- [ ] **Step 1: Manual verification (red state)**

Run: `npm run dev` (if not already running)
Navigate to: `http://localhost:3000/outfits/<OUTFIT_ID>`
Click "Shelter" in the rail. Nothing happens.

- [ ] **Step 2: Add the jump-to handler in OutfitBuilder**

In `src/components/outfit-builder.tsx`, immediately after the `categoryEntries` declaration, add:

```tsx
function handleJumpTo(category: string) {
  // Look up by data attribute, not id — categories contain spaces (e.g. "Campsite Bag")
  // which would break CSS selectors. Quoted attribute selectors handle any value.
  const el = document.querySelector(
    `[data-category-section="${CSS.escape(category)}"]`
  )
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
```

- [ ] **Step 3: Wire the handler into CategoryRail**

In the `<CategoryRail>` element added in Task 1, change the `onJumpTo={() => {}}` line to:

```tsx
onJumpTo={handleJumpTo}
```

- [ ] **Step 4: Manual verification (green state)**

Reload `http://localhost:3000/outfits/<OUTFIT_ID>` in the browser.
Expected:
- Click "Shelter" in the rail → page smooth-scrolls to the Shelter section, top of section roughly aligned with top of viewport (offset by `scroll-mt-4`)
- Click "Water" → smooth scrolls to Water section
- Click "Backpack" (top of list) → scrolls back up
- The other categories remain rendered in the gear list (jump-to doesn't filter)

- [ ] **Step 5: Commit**

```bash
git add src/components/outfit-builder.tsx
git commit -m "feat: wire CategoryRail jump-to scrolling

Clicking a category name in the rail smooth-scrolls that section into
view via scrollIntoView. Other categories remain in the list.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Implement filter mode + dismissable chip

Goal: clicking the focus icon shows only that category. A dismissable chip appears above Quick Select while filtered. Quick Select buttons still affect the entire outfit.

**Files:**
- Modify: `src/components/outfit-builder.tsx`

- [ ] **Step 1: Manual verification (red state)**

Click the focus icon (○) next to any rail row. Nothing happens.

- [ ] **Step 2: Add filterCategory state**

In `src/components/outfit-builder.tsx`, find the existing state declarations (around line 32-36):

```tsx
const [name, setName] = useState(outfitName)
const [description, setDescription] = useState(outfitDescription)
const [selected, setSelected] = useState<Set<string>>(new Set(initialSelectedIds))
const [saving, setSaving] = useState(false)
const [error, setError] = useState<string | null>(null)
```

Add a sixth state declaration immediately after `error`:

```tsx
const [filterCategory, setFilterCategory] = useState<string | null>(null)
```

- [ ] **Step 3: Add the toggle-filter handler**

Immediately after the `handleJumpTo` function added in Task 2, add:

```tsx
function handleToggleFilter(category: string) {
  setFilterCategory((prev) => (prev === category ? null : category))
}
```

- [ ] **Step 4: Filter the gear cards**

In the gear list rendering block, find this line:

```tsx
{Object.entries(categories).map(([category, catItems]) => (
```

Replace it with:

```tsx
{Object.entries(categories)
  .filter(([category]) => filterCategory === null || category === filterCategory)
  .map(([category, catItems]) => (
```

- [ ] **Step 5: Wire filter state into CategoryRail**

In the `<CategoryRail>` element, change `filterCategory={null}` to `filterCategory={filterCategory}` and `onToggleFilter={() => {}}` to `onToggleFilter={handleToggleFilter}`.

- [ ] **Step 6: Add the dismissable filter chip**

Locate the existing Quick Select buttons block:

```tsx
{/* Quick Select */}
<div className="flex flex-wrap gap-2">
```

Immediately ABOVE that comment, add the chip:

```tsx
{filterCategory && (
  <button
    type="button"
    onClick={() => setFilterCategory(null)}
    className="inline-flex items-center gap-2 self-start rounded border border-action bg-forest px-3 py-1 text-xs font-medium text-white hover:bg-forest-light transition-colors"
    aria-label={`Stop filtering by ${filterCategory}`}
  >
    <span>Showing: {filterCategory}</span>
    <span aria-hidden="true">✕</span>
  </button>
)}
```

- [ ] **Step 7: Run typecheck**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 8: Manual verification (green state)**

Reload `http://localhost:3000/outfits/<OUTFIT_ID>`.
Expected:
- Click the ○ next to "Backpack" → only the Backpack gear card renders; the icon turns into ◉ in the action color
- A "Showing: Backpack ✕" chip appears above the Quick Select buttons
- Click the chip → all categories return; the icon goes back to ○; chip disappears
- Click ○ next to "Shelter" → only Shelter renders
- Click ◉ next to "Shelter" again → all categories return (toggle off)
- While filtered to Backpack, click "All Tier 1" → all Tier 1 items across the entire outfit get selected (verify by clicking the chip to clear filter — Tier 1 items in other categories should be checked)
- Save (click Update Outfit) → confirms the action runs and you redirect to /outfits

- [ ] **Step 9: Commit**

```bash
git add src/components/outfit-builder.tsx
git commit -m "feat: add filter mode + dismissable chip to outfit builder rail

Clicking a category's focus icon hides all other gear cards. A
dismissable 'Showing: X' chip appears above Quick Select while
filtered. Quick Select operations remain global (operate on the whole
outfit, not just the filtered view). Filter state is purely UI and
never touches the DB.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Add scrollspy active highlight

Goal: as the user scrolls (when not filtered), the rail row matching the section currently in view is rendered with bolder text.

**Files:**
- Modify: `src/components/outfit-builder.tsx`

- [ ] **Step 1: Manual verification (red state)**

Reload the outfit page. Scroll the gear list. The rail rows do not change appearance as you scroll.

- [ ] **Step 2: Add useEffect import**

In `src/components/outfit-builder.tsx`, change the React import from:

```tsx
import { useState } from 'react'
```

to:

```tsx
import { useEffect, useState } from 'react'
```

- [ ] **Step 3: Add visibleCategory state**

Immediately after the `filterCategory` state declaration added in Task 3, add:

```tsx
const [visibleCategory, setVisibleCategory] = useState<string | null>(null)
```

- [ ] **Step 4: Add the IntersectionObserver effect**

Immediately after the `handleToggleFilter` function added in Task 3, add:

```tsx
useEffect(() => {
  if (filterCategory !== null) return

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort(
          (a, b) => a.boundingClientRect.top - b.boundingClientRect.top
        )[0]
      if (visible) {
        const category = visible.target.getAttribute('data-category-section')
        if (category) setVisibleCategory(category)
      }
    },
    { rootMargin: '-20% 0px -60% 0px', threshold: 0 }
  )

  document
    .querySelectorAll('[data-category-section]')
    .forEach((el) => observer.observe(el))

  return () => observer.disconnect()
}, [filterCategory])
```

- [ ] **Step 5: Wire visibleCategory into CategoryRail**

In the `<CategoryRail>` element, change `visibleCategory={null}` to `visibleCategory={visibleCategory}`.

- [ ] **Step 6: Run typecheck**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 7: Manual verification (green state)**

Reload `http://localhost:3000/outfits/<OUTFIT_ID>`.
Expected:
- As you scroll the gear list, the rail row matching the section currently in view becomes bold/white
- Other rows remain in the muted pewter-pale color
- When you click a category in the rail to jump-to, the highlight follows that section once it lands in view
- When you enter filter mode (focus icon), the highlight does not interfere — only the filtered category is rendered, and no scrollspy update happens (effect early-returns)
- When you exit filter mode, scrollspy resumes

- [ ] **Step 8: Commit**

```bash
git add src/components/outfit-builder.tsx
git commit -m "feat: add scrollspy active highlight to outfit builder rail

IntersectionObserver tracks which gear card is currently in view and
sets visibleCategory state, used by CategoryRail to bold the matching
row. Disabled while filterCategory is set, since only one category
is rendered.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Acceptance criteria verification

Goal: walk through every acceptance criterion from the spec and confirm it passes. If anything is wrong, fix it; otherwise this task ends with no commit.

**Files:** none

- [ ] **Step 1: Start dev server if not running**

Run: `npm run dev`

- [ ] **Step 2: AC1 — sticky rail with live counts at ≥768px**

Open `http://localhost:3000/outfits/<OUTFIT_ID>` in a browser sized ≥768px wide.
Expected: Left rail shows all 12 categories with `selected/total` counts. Toggle any checkbox in the gear list — the corresponding rail count updates immediately.

- [ ] **Step 3: AC2 — clicking name smooth-scrolls into view**

Click "Sleeping Bag" in the rail.
Expected: The page smooth-scrolls to the Sleeping Bag gear card. Top of the card is roughly at top of viewport (offset by scroll-mt-4).

- [ ] **Step 4: AC3 — focus icon filter and chip dismiss**

Click the focus icon (○) next to "Stove".
Expected: Only the Stove gear card renders. The icon becomes filled (◉, action color). A "Showing: Stove ✕" chip appears above the Quick Select buttons.

Click the chip.
Expected: All 12 categories return. Icon goes back to ○. Chip disappears.

Click ○ next to "Stove" again to re-filter, then click ◉ to toggle off.
Expected: Same return-to-all-categories behavior.

- [ ] **Step 5: AC4 — Quick Select operates on whole outfit while filtered**

Click ○ next to "Backpack" so only Backpack renders.
Click "All Tier 1" in Quick Select.
Click the chip to clear the filter.
Expected: Tier 1 items in categories OTHER than Backpack are now selected (visible in their gear cards and reflected in their rail counts).

Click "Clear All".
Expected: All categories show `0/N` in the rail.

- [ ] **Step 6: AC5 — save behavior unchanged**

Select a few items across different categories. Click "Update Outfit".
Expected: Redirects to `/outfits`. Click back into the same outfit.
Expected: The selections you made are present, and Quick Access Pack (or whatever category was previously) is in the state you left it.

- [ ] **Step 7: AC6 — rail hidden below 768px**

Resize the browser window to <768px wide (or use DevTools responsive mode).
Expected: The rail disappears. The gear list returns to full width and renders the existing single-column scrolling layout.

Resize back to ≥768px.
Expected: Rail returns.

- [ ] **Step 8: AC7 — no new dependencies, schema, or server actions**

Run: `git diff main --stat -- package.json src/lib/db/ src/app/actions/`
Expected: Empty output (no changes to any of those paths since the start of this feature branch).

- [ ] **Step 9: Final state check**

Run: `git status`
Expected: Working tree clean (all task commits already made). No further commit needed for this task.

If any of the above steps revealed a defect, fix it inline, run typecheck, and commit with a `fix:` prefix. Then re-run the failed step.

---

## Self-review checklist (planner)

- ✅ **Spec coverage:**
  - AC1 (sticky rail w/ counts) → Task 1, verified Task 5 Step 2
  - AC2 (jump-to scroll) → Task 2, verified Task 5 Step 3
  - AC3 (filter + dismiss chip) → Task 3, verified Task 5 Step 4
  - AC4 (quick select global while filtered) → Task 3, verified Task 5 Step 5
  - AC5 (save unchanged) → Task 3 (no save changes), verified Task 5 Step 6
  - AC6 (hidden <768px) → Task 1 (`hidden md:block`), verified Task 5 Step 7
  - AC7 (no new deps/schema/actions) → enforced by file scope, verified Task 5 Step 8
  - Optional scrollspy → Task 4 (explicitly marked optional in spec; included here)
- ✅ **Type consistency:** `CategoryEntry`, `CategoryRail`, `filterCategory`, `visibleCategory`, `handleJumpTo`, `handleToggleFilter` are referenced consistently across all tasks.
- ✅ **No placeholders:** every step shows concrete code or commands.
- ✅ **Frequent commits:** five commits across four implementation tasks.
