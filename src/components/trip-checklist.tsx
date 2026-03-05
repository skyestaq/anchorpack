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
  tripName: string
  entries: ChecklistEntry[]
}

export function TripChecklist({ tripId, tripName, entries: initialEntries }: TripChecklistProps) {
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
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-medium text-gray-600">Packing Progress</span>
          <span className="text-lg font-bold">{packedCount}/{totalItems} packed</span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              progressPercent === 100 ? 'bg-green-500' : 'bg-gray-900'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        {chargeNeeded.length > 0 && (
          <p className="mt-2 text-xs text-amber-600">
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
            className={`rounded-lg border bg-white ${
              allPacked ? 'border-green-200' : 'border-gray-200'
            }`}
          >
            <div className={`flex items-center justify-between rounded-t-lg border-b px-4 py-2 ${
              allPacked ? 'border-green-100 bg-green-50' : 'border-gray-100'
            }`}>
              <span className="text-sm font-semibold">{category}</span>
              <span className={`text-xs ${allPacked ? 'text-green-600' : 'text-gray-500'}`}>
                {allPacked ? '✓ Done' : `${catPacked}/${catEntries.length}`}
              </span>
            </div>
            <div>
              {catEntries.map((entry) => (
                <div
                  key={entry.checklist.id}
                  className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50"
                >
                  <label className="flex cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      checked={entry.checklist.isPacked}
                      onChange={() => togglePacked(entry)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <span className={`text-sm ${entry.checklist.isPacked ? 'text-gray-400 line-through' : ''}`}>
                      {entry.gear.name}
                    </span>
                  </label>
                  {entry.gear.needsCharge && (
                    <button
                      type="button"
                      onClick={() => toggleCharged(entry)}
                      className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                        entry.checklist.isCharged
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                      }`}
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
          className="rounded border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
        >
          Delete Trip
        </button>
      </div>
    </div>
  )
}
