'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { GearItem, TripChecklistItem } from '@/types/database'
import { updatePackedStatus, updateChargedStatus, deleteTrip } from '@/app/actions/trips'

interface ChecklistEntry {
  checklist: TripChecklistItem
  gear: GearItem
}

interface TripChecklistProps {
  tripId: string
  entries: ChecklistEntry[]
}

export function TripChecklist({ tripId, entries: initialEntries }: TripChecklistProps) {
  const router = useRouter()
  const [entries, setEntries] = useState(initialEntries)

  // Group by category, exclude sub-items from display (show only top-level)
  const topLevelEntries = entries.filter((e) => e.gear.parentItemId === null)
  const categories = topLevelEntries.reduce<Record<string, ChecklistEntry[]>>((acc, entry) => {
    const cat = entry.gear.category
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(entry)
    return acc
  }, {})

  const totalItems = topLevelEntries.length
  const packedCount = topLevelEntries.filter((e) => e.checklist.isPacked).length
  const chargeNeeded = topLevelEntries.filter((e) => e.gear.needsCharge)
  const chargedCount = chargeNeeded.filter((e) => e.checklist.isCharged).length
  const progressPercent = totalItems > 0 ? Math.round((packedCount / totalItems) * 100) : 0

  function updateEntry(checklistId: string, patch: Partial<TripChecklistItem>) {
    setEntries((prev) =>
      prev.map((e) =>
        e.checklist.id === checklistId
          ? { ...e, checklist: { ...e.checklist, ...patch } }
          : e
      )
    )
  }

  async function togglePacked(entry: ChecklistEntry) {
    const newValue = !entry.checklist.isPacked
    updateEntry(entry.checklist.id, { isPacked: newValue })
    await updatePackedStatus(entry.checklist.id, newValue)
  }

  async function toggleCharged(entry: ChecklistEntry) {
    const newValue = !entry.checklist.isCharged
    updateEntry(entry.checklist.id, { isCharged: newValue })
    await updateChargedStatus(entry.checklist.id, newValue)
  }

  async function handleDelete() {
    if (!confirm('Delete this trip and its checklist?')) return
    await deleteTrip(tripId)
    // redirect happens in the server action
  }

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="rounded-lg border border-pewter-mid bg-pewter-light p-4">
        <div className="flex items-baseline justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-pewter-pale">Packing Progress</span>
          <span className="font-display text-lg text-white">{packedCount}/{totalItems} packed</span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-pewter">
          <div
            className="h-full rounded-full bg-action transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        {chargeNeeded.length > 0 && (
          <p className="mt-2 font-data text-xs text-action">
            ⚡ {chargedCount}/{chargeNeeded.length} charged
          </p>
        )}
      </div>

      {/* Checklist by Category */}
      {Object.entries(categories).map(([category, catEntries]) => {
        const catPacked = catEntries.filter((e) => e.checklist.isPacked).length
        const allPacked = catPacked === catEntries.length
        return (
          <div
            key={category}
            className={`overflow-hidden rounded-lg border bg-pewter-light ${
              allPacked ? 'border-action' : 'border-pewter-mid'
            }`}
          >
            <div className={`flex items-center justify-between border-b px-4 py-2 ${
              allPacked ? 'border-action/30 bg-forest/20' : 'border-pewter-mid'
            }`}>
              <span className="text-sm font-medium text-white">{category}</span>
              <span className={`font-data text-xs ${allPacked ? 'text-action' : 'text-pewter-pale'}`}>
                {allPacked ? '✓ Done' : `${catPacked}/${catEntries.length}`}
              </span>
            </div>
            <div>
              {catEntries.map((entry) => (
                <div
                  key={entry.checklist.id}
                  className="flex items-center justify-between px-4 py-2.5 hover:bg-pewter transition-colors"
                >
                  <label className="flex cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      checked={entry.checklist.isPacked}
                      onChange={() => togglePacked(entry)}
                      className="h-4 w-4 rounded accent-action"
                    />
                    <span className={`text-sm ${entry.checklist.isPacked ? 'text-pewter-mid line-through' : 'text-white'}`}>
                      {entry.gear.manufacturer ? `${entry.gear.manufacturer} ${entry.gear.name}` : entry.gear.name}
                    </span>
                  </label>
                  {entry.gear.needsCharge && (
                    <button
                      type="button"
                      onClick={() => toggleCharged(entry)}
                      className="rounded border border-action bg-forest px-2 py-1 font-data text-xs font-medium text-white hover:bg-forest-light transition-colors"
                    >
                      {entry.checklist.isCharged ? '⚡ Charged' : '⚡ Charge?'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      })}

      {/* Delete Trip */}
      <div className="pt-4">
        <button
          type="button"
          onClick={handleDelete}
          className="rounded border border-red-800 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-900/20 transition-colors"
        >
          Delete Trip
        </button>
      </div>
    </div>
  )
}
