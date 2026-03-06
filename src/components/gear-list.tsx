'use client'

import { useState } from 'react'
import Link from 'next/link'
import { GearItem } from '@/types/database'

function displayName(item: { manufacturer: string | null; name: string }): string {
  return item.manufacturer ? `${item.manufacturer} ${item.name}` : item.name
}

function formatWeight(oz: string | number | null): string {
  if (oz === null || oz === undefined) return '—'
  const ozNum = typeof oz === 'string' ? parseFloat(oz) : oz
  if (isNaN(ozNum) || ozNum === 0) return '—'
  if (ozNum >= 16) return `${(ozNum / 16).toFixed(1)} lbs`
  return `${ozNum} oz`
}

function TierBadge({ tier }: { tier: number | null }) {
  if (!tier) return null
  const classes: Record<number, string> = {
    1: 'bg-action text-forest-dark',
    2: 'bg-forest text-white',
    3: 'bg-pewter-mid text-white',
  }
  return (
    <span className={`font-data rounded px-1.5 py-0.5 text-xs font-medium ${classes[tier] ?? ''}`}>
      T{tier}
    </span>
  )
}

const CATEGORY_ORDER: Record<string, { index: number; label: string; description: string }> = {
  'Backpack':     { index: 0,  label: '00  Backpack',     description: 'Pack and key items carried inside it' },
  'Shelter':      { index: 1,  label: '01  Shelter',      description: 'Tents, hammocks, and tarps' },
  'Sleeping Bag': { index: 2,  label: '02  Sleeping Bag', description: 'Sleeping bags and liners' },
  'Sleeping Pad': { index: 3,  label: '03  Sleeping Pad', description: 'Pads, pillows, and insulation from the ground' },
  'Stuff Sacks':  { index: 4,  label: '04  Stuff Sacks',  description: 'Compression and stuff sacks' },
  'Water':        { index: 5,  label: '05  Water System',  description: 'Filtration, bottles, and hydration' },
  'Stove':        { index: 6,  label: '06  Cook System',  description: 'Stove, fuel, and cook kit' },
  'Food':         { index: 7,  label: '07  Food',         description: 'Meals, snacks, and food bag' },
  'Quick Bag':    { index: 8,  label: '08  Quick Bag',    description: 'Hip belt and top-lid quick-access items' },
  'Campsite Bag': { index: 9,  label: '09  Campsite Bag', description: 'Camp shoes, comfort, and site extras' },
  'Clothes':      { index: 10, label: '10  Clothing',      description: 'Layers, rain gear, and wearables' },
  'Day-Of':       { index: 11, label: '11  Day-Of',       description: 'Items packed the morning of departure' },
}

function categoryLabel(cat: string): string {
  return CATEGORY_ORDER[cat]?.label ?? cat
}

function categoryDescription(cat: string): string {
  return CATEGORY_ORDER[cat]?.description ?? ''
}

interface GearListProps {
  items: GearItem[]
}

export function GearList({ items }: GearListProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  // Top-level items only (no parent)
  const topLevel = items.filter((i) => i.parentItemId === null)

  // Group top-level by category
  const rawCategories = topLevel.reduce<Record<string, GearItem[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = []
    acc[item.category].push(item)
    return acc
  }, {})

  // Sort categories by defined order, unknown categories go last alphabetically
  const categories = Object.fromEntries(
    Object.entries(rawCategories).sort(([a], [b]) => {
      const ai = CATEGORY_ORDER[a]?.index ?? 999
      const bi = CATEGORY_ORDER[b]?.index ?? 999
      return ai !== bi ? ai - bi : a.localeCompare(b)
    })
  )

  // Children map
  const childrenMap = items.reduce<Record<string, GearItem[]>>((acc, item) => {
    if (item.parentItemId) {
      if (!acc[item.parentItemId]) acc[item.parentItemId] = []
      acc[item.parentItemId].push(item)
    }
    return acc
  }, {})

  function toggleCategory(cat: string) {
    setExpandedCategories((prev) => {
      const next = new Set(prev)
      next.has(cat) ? next.delete(cat) : next.add(cat)
      return next
    })
  }

  function categoryWeight(catItems: GearItem[], childrenMap: Record<string, GearItem[]>): number {
    return catItems.reduce((sum, item) => {
      const itemOz = item.weightOz ? parseFloat(String(item.weightOz)) : 0
      const childrenOz = (childrenMap[item.id] ?? []).reduce((cSum, child) => {
        const oz = child.weightOz ? parseFloat(String(child.weightOz)) : 0
        return cSum + (isNaN(oz) ? 0 : oz)
      }, 0)
      return sum + (isNaN(itemOz) ? 0 : itemOz) + childrenOz
    }, 0)
  }

  return (
    <div className="space-y-2 max-w-[75%]">
      {Object.entries(categories).map(([category, rawCatItems]) => {
        const catItems = [...rawCatItems].sort((a, b) => {
          const tierA = a.tier ?? 999
          const tierB = b.tier ?? 999
          if (tierA !== tierB) return tierA - tierB
          const primaryA = a.isPrimary ? 0 : 1
          const primaryB = b.isPrimary ? 0 : 1
          if (primaryA !== primaryB) return primaryA - primaryB
          return displayName(a).localeCompare(displayName(b))
        })
        return (
        <div key={category} className="rounded-lg border border-pewter-mid bg-pewter-light overflow-hidden">
          <button
            onClick={() => toggleCategory(category)}
            className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-pewter transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="text-xs text-pewter-pale">{expandedCategories.has(category) ? '▾' : '▸'}</span>
              <span className="font-data text-sm font-medium text-white">{categoryLabel(category)}</span>
              {categoryDescription(category) && (
                <span className="text-xs text-pewter-mid">{categoryDescription(category)}</span>
              )}
            </div>
            <span className="font-data text-xs text-pewter-pale">{catItems.length} items</span>
          </button>

          {expandedCategories.has(category) && (
            <div className="border-t border-pewter-mid">
              {catItems.map((item) => {
                const children = childrenMap[item.id] ?? []
                return (
                  <div key={item.id}>
                    <div className={`flex items-center justify-between px-4 py-2 hover:bg-pewter transition-colors border-l-2 ${item.isPrimary ? 'border-action' : 'border-forest-light'}`}>
                      <div className="flex flex-wrap items-center gap-2">
                        <Link href={`/gear/${item.id}/edit`} className="text-sm text-white hover:text-action transition-colors">
                          {displayName(item)}
                        </Link>
                        <TierBadge tier={item.tier} />
                        {!item.isPrimary && (
                          <span className="font-data rounded bg-pewter-mid px-1.5 py-0.5 text-xs text-pewter-pale">
                            optional
                          </span>
                        )}
                        {item.needsCharge && (
                          <span className="text-xs text-action" title="Needs charge">⚡</span>
                        )}
                        {children.length > 0 && (
                          <span className="font-data text-xs text-pewter-mid">{children.length} sub-items</span>
                        )}
                      </div>
                      <span className="ml-4 shrink-0 font-data text-xs text-pewter-pale">
                        {formatWeight(item.weightOz)}
                      </span>
                    </div>
                    {children.map((child) => (
                      <div
                        key={child.id}
                        className="flex items-center justify-between py-1.5 pl-10 pr-4 border-l-2 border-pewter-mid hover:bg-pewter transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-pewter-mid">↳</span>
                          <span className="text-xs text-pewter-pale">{displayName(child)}</span>
                          {child.needsCharge && (
                            <span className="text-xs text-action">⚡</span>
                          )}
                        </div>
                        <span className="font-data text-xs text-pewter-mid">{formatWeight(child.weightOz)}</span>
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          )}
        </div>
        )
      })}
    </div>
  )
}
