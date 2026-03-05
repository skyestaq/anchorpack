'use client'

import { useState } from 'react'
import Link from 'next/link'
import { GearItem } from '@/types/database'

function formatWeight(oz: string | number | null): string {
  if (oz === null || oz === undefined) return '—'
  const ozNum = typeof oz === 'string' ? parseFloat(oz) : oz
  if (isNaN(ozNum) || ozNum === 0) return '—'
  if (ozNum >= 16) return `${(ozNum / 16).toFixed(1)} lbs`
  return `${ozNum} oz`
}

function TierBadge({ tier }: { tier: number | null }) {
  if (!tier) return null
  const colors: Record<number, string> = {
    1: 'bg-green-100 text-green-700',
    2: 'bg-yellow-100 text-yellow-700',
    3: 'bg-red-100 text-red-700',
  }
  return (
    <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${colors[tier] ?? ''}`}>
      T{tier}
    </span>
  )
}

interface GearListProps {
  items: GearItem[]
}

export function GearList({ items }: GearListProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  // Top-level items only (no parent)
  const topLevel = items.filter((i) => i.parentItemId === null)

  // Group top-level by category
  const categories = topLevel.reduce<Record<string, GearItem[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = []
    acc[item.category].push(item)
    return acc
  }, {})

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
    <div className="space-y-2">
      {Object.entries(categories).map(([category, catItems]) => (
        <div key={category} className="rounded-lg border border-gray-200 bg-white">
          <button
            onClick={() => toggleCategory(category)}
            className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-gray-50"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm">{expandedCategories.has(category) ? '▾' : '▸'}</span>
              <span className="text-sm font-semibold">{category}</span>
              <span className="text-xs text-gray-400">({catItems.length})</span>
            </div>
            <span className="text-xs text-gray-500">{formatWeight(categoryWeight(catItems, childrenMap))}</span>
          </button>

          {expandedCategories.has(category) && (
            <div className="border-t border-gray-100">
              {catItems.map((item) => {
                const children = childrenMap[item.id] ?? []
                return (
                  <div key={item.id}>
                    <div className="flex items-center justify-between px-4 py-2 hover:bg-gray-50">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link href={`/gear/${item.id}/edit`} className="text-sm hover:underline">
                          {item.name}
                        </Link>
                        <TierBadge tier={item.tier} />
                        {!item.isPrimary && (
                          <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">
                            optional
                          </span>
                        )}
                        {item.needsCharge && (
                          <span className="text-xs text-amber-500" title="Needs charge">⚡</span>
                        )}
                        {children.length > 0 && (
                          <span className="text-xs text-gray-400">{children.length} sub-items</span>
                        )}
                      </div>
                      <span className="ml-4 shrink-0 text-xs text-gray-500">
                        {formatWeight(item.weightOz)}
                      </span>
                    </div>
                    {children.map((child) => (
                      <div
                        key={child.id}
                        className="flex items-center justify-between py-1.5 pl-10 pr-4 hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">↳</span>
                          <span className="text-xs text-gray-700">{child.name}</span>
                          {child.needsCharge && (
                            <span className="text-xs text-amber-500">⚡</span>
                          )}
                        </div>
                        <span className="text-xs text-gray-400">{formatWeight(child.weightOz)}</span>
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
