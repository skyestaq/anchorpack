'use client'

import { useState } from 'react'
import { unstable_rethrow } from 'next/navigation'
import { GearItem } from '@/types/database'
import { createOutfit, updateOutfit, deleteOutfit } from '@/app/actions/outfits'
import { CategoryRail, type CategoryEntry } from './category-rail'

interface OutfitBuilderProps {
  outfitId?: string
  outfitName?: string
  outfitDescription?: string
  allItems: GearItem[]
  initialSelectedIds: string[]
}

function displayName(item: { manufacturer: string | null; name: string }): string {
  return item.manufacturer ? `${item.manufacturer} ${item.name}` : item.name
}

function formatWeight(oz: number): string {
  if (oz === 0) return '0 oz'
  if (oz >= 16) return `${(oz / 16).toFixed(2)} lbs`
  return `${oz.toFixed(1)} oz`
}

export function OutfitBuilder({
  outfitId,
  outfitName = '',
  outfitDescription = '',
  allItems,
  initialSelectedIds,
}: OutfitBuilderProps) {
  const [name, setName] = useState(outfitName)
  const [description, setDescription] = useState(outfitDescription)
  const [selected, setSelected] = useState<Set<string>>(new Set(initialSelectedIds))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Top-level items only
  const topLevel = allItems.filter((i) => i.parentItemId === null)

  // Group by category
  const categories = topLevel.reduce<Record<string, GearItem[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = []
    acc[item.category].push(item)
    return acc
  }, {})

  // Children map
  const childrenMap = allItems.reduce<Record<string, GearItem[]>>((acc, item) => {
    if (item.parentItemId) {
      if (!acc[item.parentItemId]) acc[item.parentItemId] = []
      acc[item.parentItemId].push(item)
    }
    return acc
  }, {})

  const categoryEntries: CategoryEntry[] = Object.entries(categories).map(
    ([name, items]) => ({
      name,
      total: items.length,
      selected: items.filter((i) => selected.has(i.id)).length,
    })
  )

  function toggleItem(itemId: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(itemId)) {
        next.delete(itemId)
        // Remove children
        ;(childrenMap[itemId] ?? []).forEach((c) => next.delete(c.id))
      } else {
        next.add(itemId)
        // Add children
        ;(childrenMap[itemId] ?? []).forEach((c) => next.add(c.id))
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
      if (filter === 'primary' && item.isPrimary) ids.add(item.id)
    })
    setSelected(ids)
  }

  // Weight calculations
  const selectedTopLevel = topLevel.filter((i) => selected.has(i.id))
  const totalWeightOz = selectedTopLevel.reduce((sum, item) => {
    const oz = item.weightOz ? parseFloat(String(item.weightOz)) : 0
    const childOz = (childrenMap[item.id] ?? [])
      .filter((c) => selected.has(c.id))
      .reduce((cs, c) => cs + (c.weightOz ? parseFloat(String(c.weightOz)) : 0), 0)
    return sum + (isNaN(oz) ? 0 : oz) + childOz
  }, 0)

  const categoryWeights = selectedTopLevel.reduce<Record<string, number>>((acc, item) => {
    const oz = item.weightOz ? parseFloat(String(item.weightOz)) : 0
    const childOz = (childrenMap[item.id] ?? [])
      .filter((c) => selected.has(c.id))
      .reduce((cs, c) => cs + (c.weightOz ? parseFloat(String(c.weightOz)) : 0), 0)
    acc[item.category] = (acc[item.category] ?? 0) + (isNaN(oz) ? 0 : oz) + childOz
    return acc
  }, {})

  async function handleSave() {
    if (!name.trim()) return
    setSaving(true)
    setError(null)
    try {
      const ids = Array.from(selected)
      if (outfitId) {
        await updateOutfit(outfitId, name, description, ids)
      } else {
        await createOutfit(name, description, ids)
      }
    } catch (err) {
      unstable_rethrow(err)
      setError(err instanceof Error ? err.message : 'Failed to save outfit')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!outfitId || !confirm('Delete this outfit?')) return
    setSaving(true)
    setError(null)
    try {
      await deleteOutfit(outfitId)
    } catch (err) {
      unstable_rethrow(err)
      setError(err instanceof Error ? err.message : 'Failed to delete outfit')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Name & Description */}
      <div className="space-y-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Outfit name..."
          className="w-full rounded border border-pewter-mid bg-pewter px-3 py-2 font-display text-lg text-white placeholder-pewter-mid focus:border-action focus:outline-none focus:ring-1 focus:ring-action"
        />
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)"
          className="w-full rounded border border-pewter-mid bg-pewter px-3 py-2 text-sm text-pewter-pale placeholder-pewter-mid focus:border-action focus:outline-none focus:ring-1 focus:ring-action"
        />
      </div>

      {/* Weight Summary */}
      <div className="rounded-lg border border-pewter-mid bg-pewter-light p-4">
        <div className="flex items-baseline justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-pewter-pale">Total Weight</span>
          <span className="font-display text-2xl text-action">{formatWeight(totalWeightOz)}</span>
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
          {Object.entries(categoryWeights).map(([cat, oz]) => (
            <span key={cat} className="font-data text-xs text-pewter-pale">
              {cat}: {formatWeight(oz)}
            </span>
          ))}
        </div>
        <p className="mt-2 font-data text-xs text-pewter-mid">{selected.size} items selected</p>
      </div>

      {/* Quick Select */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => quickSelect('tier1')}
          className="rounded border border-action bg-forest px-3 py-1.5 text-xs font-medium text-white hover:bg-forest-light transition-colors"
        >
          All Tier 1
        </button>
        <button
          type="button"
          onClick={() => quickSelect('primary')}
          className="rounded border border-action bg-forest px-3 py-1.5 text-xs font-medium text-white hover:bg-forest-light transition-colors"
        >
          All Primary
        </button>
        <button
          type="button"
          onClick={() => quickSelect('clear')}
          className="rounded border border-pewter-mid px-3 py-1.5 text-xs font-medium text-pewter-pale hover:border-red-400 hover:text-red-400 transition-colors"
        >
          Clear All
        </button>
      </div>

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

      {/* Actions */}
      <div className="space-y-2">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="rounded border border-action bg-forest px-4 py-2 text-sm font-medium text-white hover:bg-forest-light transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : outfitId ? 'Update Outfit' : 'Create Outfit'}
          </button>
          {outfitId && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={saving}
              className="rounded border border-red-800 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-900/20 disabled:opacity-50"
            >
              Delete Outfit
            </button>
          )}
        </div>
        {error && (
          <p role="alert" className="rounded border border-red-800 bg-red-900/20 px-3 py-2 text-sm text-red-400">
            {error}
          </p>
        )}
      </div>
    </div>
  )
}
