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
          // Scrollspy highlight only applies when not filtered — only one section is visible during filter mode
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
                title={
                  isFiltered ? `Stop filtering by ${cat.name}` : `Filter to ${cat.name}`
                }
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
