'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { GearItem } from '@/types/database'
import { createGearItem, updateGearItem, deleteGearItem } from '@/app/actions/gear'

interface GearFormProps {
  item?: GearItem
  parentItems: Pick<GearItem, 'id' | 'name'>[]
}

export function GearForm({ item, parentItems }: GearFormProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  async function handleSubmit(formData: FormData) {
    setSaving(true)
    if (item) {
      await updateGearItem(item.id, formData)
    } else {
      await createGearItem(formData)
    }
    router.push('/gear')
  }

  async function handleDelete() {
    if (!item || !confirm('Delete this item?')) return
    setSaving(true)
    await deleteGearItem(item.id)
    router.push('/gear')
  }

  return (
    <form action={handleSubmit} className="max-w-lg space-y-4">
      <div>
        <label className="block text-sm font-medium">Name</label>
        <input
          name="name"
          defaultValue={item?.name}
          required
          className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Category</label>
          <input
            name="category"
            defaultValue={item?.category}
            required
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Sub-Category</label>
          <input
            name="sub_category"
            defaultValue={item?.subCategory}
            required
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Weight (oz)</label>
          <input
            name="weight_oz"
            type="number"
            step="0.01"
            defaultValue={item?.weightOz ?? ''}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Tier</label>
          <select
            name="tier"
            defaultValue={item?.tier ?? ''}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          >
            <option value="">None</option>
            <option value="1">Tier 1</option>
            <option value="2">Tier 2</option>
            <option value="3">Tier 3</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium">Parent Item</label>
        <select
          name="parent_item_id"
          defaultValue={item?.parentItemId ?? ''}
          className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        >
          <option value="">None (top-level item)</option>
          {parentItems.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="is_primary" defaultChecked={item?.isPrimary ?? true} />
          Primary
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="is_weighed" defaultChecked={item?.isWeighed ?? false} />
          Weighed
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="needs_charge" defaultChecked={item?.needsCharge ?? false} />
          Needs Charge
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium">Notes</label>
        <textarea
          name="notes"
          defaultValue={item?.notes ?? ''}
          rows={2}
          className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : item ? 'Update' : 'Add Item'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-100"
        >
          Cancel
        </button>
        {item && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={saving}
            className="ml-auto rounded border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            Delete
          </button>
        )}
      </div>
    </form>
  )
}
