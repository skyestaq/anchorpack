'use client'

import { useState } from 'react'
import { Outfit } from '@/types/database'
import { createTrip } from '@/app/actions/trips'

interface TripFormProps {
  outfits: Outfit[]
}

const inputClass = 'mt-1 w-full rounded border border-pewter-mid bg-pewter px-3 py-2 text-sm text-white placeholder-pewter-mid focus:border-action focus:outline-none focus:ring-1 focus:ring-action'

export function TripForm({ outfits }: TripFormProps) {
  const [saving, setSaving] = useState(false)

  async function handleSubmit(formData: FormData) {
    setSaving(true)
    try {
      const name = formData.get('name') as string
      const outfitId = formData.get('outfit_id') as string
      const date = (formData.get('date') as string) || null
      await createTrip(name, outfitId, date)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form action={handleSubmit} className="max-w-lg space-y-4">
      <div>
        <label className="block text-xs font-medium uppercase tracking-wider text-pewter-pale">Trip Name</label>
        <input
          name="name"
          required
          placeholder="e.g., Mt. Whitney June 2026"
          className={inputClass}
        />
      </div>

      <div>
        <label className="block text-xs font-medium uppercase tracking-wider text-pewter-pale">Outfit</label>
        <select
          name="outfit_id"
          required
          className={inputClass}
        >
          <option value="">Select an outfit...</option>
          {outfits.map((o) => (
            <option key={o.id} value={o.id}>{o.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium uppercase tracking-wider text-pewter-pale">
          Trip Date <span className="text-pewter-mid normal-case">(optional)</span>
        </label>
        <input
          name="date"
          type="date"
          className={inputClass}
        />
      </div>

      <button
        type="submit"
        disabled={saving}
        className="rounded border border-action bg-forest px-4 py-2 text-sm font-medium text-white hover:bg-forest-light transition-colors disabled:opacity-50"
      >
        {saving ? 'Creating...' : 'Create Trip'}
      </button>
    </form>
  )
}
