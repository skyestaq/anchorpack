# Outfit Builder — Category Rail

**Date:** 2026-04-09
**Status:** Design approved, ready for implementation plan

## Problem

The Outfit Builder shows 12 top-level gear categories totalling ~87 items (plus children). Editing an outfit currently requires scrolling the entire list to find a section. We want a way to navigate to and focus on a specific category without scrolling.

## Goal

Add a persistent category navigator to the Outfit Builder that supports:

1. **Jump-to** — click a category name to scroll its section into view.
2. **Filter** — click a category's focus icon to render only that section, hiding all others.

Both behaviors live in the same UI element. Filter is purely a view concern; the underlying selection (`selected` Set) is unaffected by filtering.

## Non-goals

- Mobile / narrow-viewport layout. The rail is hidden below 768px; mobile users see the existing scrolling list. Revisit if mobile use grows.
- Persisting filter state across navigation or saves.
- Filtering by anything other than top-level category (no sub-category, tier, primary, search).
- Keyboard shortcuts for the rail.

## UI

A new persistent left column ("CategoryRail") inside `OutfitBuilder`, sitting between the Quick Select buttons and the gear cards. Layout:

```
┌─────────────────────────────────────────────────────┐
│ Outfit name + description                           │
│ Total Weight summary card                           │
│ [Showing: Backpack ✕]   ← only when filtered       │
│ [All Tier 1] [All Primary] [Clear All]              │
├──────────┬──────────────────────────────────────────┤
│ RAIL     │  GEAR LIST                               │
│ ──────── │                                          │
│ Backpack │  ┌─ Backpack ──────────────────────┐    │
│  5/21 ⊙  │  │ ☑ Osprey Exos 58       36 oz    │    │
│ Shelter  │  │ ☐ Pack Cover            3 oz    │    │
│  0/7  ⊙  │  └─────────────────────────────────┘    │
│ ...      │                                          │
└──────────┴──────────────────────────────────────────┘
```

- Rail width: ~140–160px.
- Rail uses `position: sticky; top: <header offset>`.
- Right column flexes to fill remaining width.
- Responsive layout:
  - Wrapper is `<div className="md:flex md:gap-4">` — `flex` only at md+. Below md, default block layout means children stack normally.
  - `<CategoryRail>` itself uses `hidden md:block` so the rail is invisible below 768px while the gear list (its sibling) remains visible and full-width.
  - The gear-list column uses `flex-1 min-w-0` so it fills the available width on md+ and isn't squeezed by the rail.

Each rail row shows:
- **Section name** (clickable link area)
- **Selected/total count** (e.g., `5/21`), updates live as the user toggles items
- **Focus icon** on the right (outlined when inactive, filled when this category is the active filter)

## Interaction model

| User action | Effect |
|---|---|
| Click rail item *name* | `document.getElementById(\`cat-${category}\`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })`. Filter state unchanged. |
| Click rail item *focus icon* (when not active) | `setFilterCategory(category)` — only that category's gear card renders in the right column |
| Click rail item *focus icon* (when active) | `setFilterCategory(null)` — full list re-renders |
| Click "Showing: X ✕" chip | `setFilterCategory(null)` |
| Quick Select buttons (Tier 1 / Primary / Clear All) | Always operate on the **whole outfit**, not just the filtered view. They are global operations; the filter is just a view. |
| `toggleItem` on a gear row | Unchanged from today |
| Save / Delete | Unchanged. Filter state never touches the DB. |

### Optional: scrollspy highlight

When **not** filtered, an `IntersectionObserver` watches the gear cards (`#cat-${category}` elements) and sets a separate `visibleCategory` state. The rail row matching `visibleCategory` is rendered with bolder text / brighter color to indicate "this is what you're looking at right now".

This is a small UX refinement — pleasant but not load-bearing. If the implementation plan finds it adds meaningful complexity (e.g., observer setup interacts badly with the filter mode), it can be cut without affecting the rest of the design.

## Component structure

### New file: `src/components/category-rail.tsx`

Stateless client component. Pure presentational — does no Set/Map manipulation.

```ts
'use client'

interface CategoryEntry {
  name: string
  total: number      // count of top-level items in this category
  selected: number   // how many of those are in the selected Set
}

interface CategoryRailProps {
  categories: CategoryEntry[]
  filterCategory: string | null
  visibleCategory: string | null   // for scrollspy highlight
  onJumpTo: (category: string) => void
  onToggleFilter: (category: string) => void
}

export function CategoryRail(props: CategoryRailProps) { ... }
```

~80 lines, sticky positioning, hidden below `md`.

### Modified: `src/components/outfit-builder.tsx`

Changes:

1. **New state:**
   ```ts
   const [filterCategory, setFilterCategory] = useState<string | null>(null)
   const [visibleCategory, setVisibleCategory] = useState<string | null>(null)
   ```

2. **Compute the `CategoryEntry[]` array** from the existing `categories` reduce + the `selected` Set. One additional reduce — counts are already implicit in the existing data.

3. **`useEffect` setting up an `IntersectionObserver`** for scrollspy. Observes `#cat-${name}` elements; updates `visibleCategory`. Cleanup on unmount. Only active when `filterCategory === null`.

4. **Wrap the existing categories map** in a flex container:
   ```tsx
   <div className="flex gap-4">
     <CategoryRail ... />
     <div className="flex-1 space-y-4">
       {Object.entries(categories)
         .filter(([cat]) => filterCategory === null || cat === filterCategory)
         .map(([category, catItems]) => (
           <div id={`cat-${category}`} key={category} ...>
             ...
           </div>
         ))}
     </div>
   </div>
   ```

5. **Add the dismissable filter chip** conditionally rendered above the Quick Select buttons:
   ```tsx
   {filterCategory && (
     <button onClick={() => setFilterCategory(null)} ...>
       Showing: {filterCategory} ✕
     </button>
   )}
   ```

6. **Each gear card gets `id={\`cat-${category}\`}`** so `scrollIntoView` and the IntersectionObserver can find it.

7. **`quickSelect`, `toggleItem`, `handleSave`, `handleDelete` are unchanged.**

## Out of scope

- Server-side changes — none. No new actions, schema, or dependencies.
- Mobile-specific rail layout
- Filter persistence
- Multi-category filtering
- Sub-category, tier, or text-search filtering
- Keyboard shortcuts

## Risks

- **IntersectionObserver setup edge cases.** Re-running the observer when the gear card list changes (e.g., toggling filter mode) needs careful effect dependencies. Mitigation: only enable observer when not filtered; tear down and recreate on mode change.
- **Rail width on narrow desktop windows.** At 768–900px viewport the rail + gear list both feel cramped. Mitigation: rail max-width 160px, gear list `flex-1 min-w-0`. Acceptable tradeoff for the desktop-first decision.
- **`scrollIntoView` from inside a sticky-header layout** can land the section under the header. Mitigation: use `scroll-margin-top` Tailwind utility on each gear card to offset the sticky header.

## Acceptance criteria

1. On viewports ≥768px, a sticky left rail shows all 12 categories with live selected/total counts.
2. Clicking a category name smooth-scrolls that gear card to the top of the visible area.
3. Clicking a category's focus icon hides all other categories from the gear list. Clicking it again (or the dismissable chip) restores the full list.
4. While filtered, Quick Select buttons still affect the entire outfit (verified by clicking "All Tier 1" while filtered to Backpack — every Tier 1 item across all categories becomes selected).
5. Save behavior is identical to today: the full `selected` Set is persisted regardless of filter state.
6. Below 768px, the rail is invisible; the existing single-column scrolling layout renders.
7. No new dependencies, no schema changes, no server-action changes.
