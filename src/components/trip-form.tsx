'use client'

import { useState } from 'react'
import { Outfit } from '@/types/database'
import { createTrip } from '@/app/actions/trips'

interface TripFormProps {
  outfits: Outfit[]
}

export function TripForm({ outfits }: TripFormProps) {
  const [saving, setSaving] = useState(false)

  async function handleSubmit(formData: FormData) {
    setSaving(true)
    const name = formData.get('name') as string
    const outfitId = formData.get('outfit_id') as string
    const date = (formData.get('date') as string) || null
    await createTrip(name, outfitId, date)
    // redirect happens in the server action
  }

  return (
    <form action={handleSubmit} className="max-w-lg space-y-4">
      <div>
        <label className="block text-sm font-medium">Trip Name</label>
        <input
          name="name"
          required
          placeholder="e.g., Mt. Whitney June 2026"
          className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Outfit</label>
        <select
          name="outfit_id"
          required
          className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        >
          <option value="">Select an outfit...</option>
          {outfits.map((o) => (
            <option key={o.id} value={o.id}>{o.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium">Trip Date <span className="text-gray-400">(optional)</span></label>
        <input
          name="date"
          type="date"
          className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
      </div>

      <button
        type="submit"
        disabled={saving}
        className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
      >
        {saving ? 'Creating...' : 'Create Trip'}
      </button>
    </form>
  )
}
