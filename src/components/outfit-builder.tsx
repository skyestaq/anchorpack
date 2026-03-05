'use client'

import { useState } from 'react'
import { GearItem } from '@/types/database'
import { createOutfit, updateOutfit, deleteOutfit } from '@/app/actions/outfits'

interface OutfitBuilderProps {
  outfitId?: string
  outfitName?: string
  outfitDescription?: string
  allItems: GearItem[]
  selectedItemIds: Set<string>
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
  selectedItemIds: initialSelected,
}: OutfitBuilderProps) {
  const [name, setName] = useState(outfitName)
  const [description, setDescription] = useState(outfitDescription)
  const [selected, setSelected] = useState<Set<string>>(new Set(initialSelected))
  const [saving, setSaving] = useState(false)

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
    const ids = Array.from(selected)
    if (outfitId) {
      await updateOutfit(outfitId, name, description, ids)
    } else {
      await createOutfit(name, description, ids)
    }
    // redirect happens in the server action
  }

  async function handleDelete() {
    if (!outfitId || !confirm('Delete this outfit?')) return
    setSaving(true)
    await deleteOutfit(outfitId)
  }

  return (
    <div className="space-y-6">
      {/* Name & Description */}
      <div className="space-y-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Outfit name..."
          className="w-full rounded border border-gray-300 px-3 py-2 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)"
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
      </div>

      {/* Weight Summary */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-medium text-gray-600">Total Weight</span>
          <span className="text-2xl font-bold">{formatWeight(totalWeightOz)}</span>
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
          {Object.entries(categoryWeights).map(([cat, oz]) => (
            <span key={cat} className="text-xs text-gray-500">
              {cat}: {formatWeight(oz)}
            </span>
          ))}
        </div>
        <p className="mt-2 text-xs text-gray-400">{selected.size} items selected</p>
      </div>

      {/* Quick Select */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => quickSelect('tier1')}
          className="rounded border border-gray-300 px-3 py-1.5 text-xs font-medium hover:bg-gray-100"
        >
          All Tier 1
        </button>
        <button
          type="button"
          onClick={() => quickSelect('primary')}
          className="rounded border border-gray-300 px-3 py-1.5 text-xs font-medium hover:bg-gray-100"
        >
          All Primary
        </button>
        <button
          type="button"
          onClick={() => quickSelect('clear')}
          className="rounded border border-gray-300 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
        >
          Clear All
        </button>
      </div>

      {/* Gear by Category */}
      {Object.entries(categories).map(([category, catItems]) => (
        <div key={category} className="rounded-lg border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-4 py-2">
            <span className="text-sm font-semibold">{category}</span>
          </div>
          <div>
            {catItems.map((item) => {
              const children = childrenMap[item.id] ?? []
              const isChecked = selected.has(item.id)
              return (
                <div key={item.id}>
                  <label className="flex cursor-pointer items-center justify-between px-4 py-2.5 hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleItem(item.id)}
                        className="h-4 w-4 rounded border-gray-300"
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
                      {!item.isPrimary && (
                        <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">optional</span>
                      )}
                    </div>
                    <span className="ml-2 shrink-0 text-xs text-gray-500">
                      {item.weightOz ? `${parseFloat(String(item.weightOz))} oz` : '—'}
                    </span>
                  </label>
                  {isChecked && children.length > 0 && (
                    <div className="border-t border-gray-50 pb-1">
                      {children.map((child) => (
                        <div key={child.id} className="flex items-center gap-2 py-1 pl-11 pr-4 text-gray-500">
                          <span className="text-xs">&#x21B3; {child.name}</span>
                          {child.needsCharge && <span className="text-xs text-amber-500">&#x26A1;</span>}
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

      {/* Actions */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !name.trim()}
          className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : outfitId ? 'Update Outfit' : 'Create Outfit'}
        </button>
        {outfitId && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={saving}
            className="rounded border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            Delete Outfit
          </button>
        )}
      </div>
    </div>
  )
}
