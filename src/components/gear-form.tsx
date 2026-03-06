'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { GearItem } from '@/types/database'
import { createGearItem, updateGearItem, deleteGearItem } from '@/app/actions/gear'

interface GearFormProps {
  item?: GearItem
  parentItems: Pick<GearItem, 'id' | 'name'>[]
}

const inputClass = 'mt-1 w-full rounded border border-pewter-mid bg-pewter px-3 py-2 text-sm text-white placeholder-pewter-mid focus:border-action focus:outline-none focus:ring-1 focus:ring-action'

export function GearForm({ item, parentItems }: GearFormProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  async function handleSubmit(formData: FormData) {
    setSaving(true)
    try {
      if (item) {
        await updateGearItem(item.id, formData)
      } else {
        await createGearItem(formData)
      }
      router.push('/gear')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!item || !confirm('Delete this item?')) return
    setSaving(true)
    try {
      await deleteGearItem(item.id)
      router.push('/gear')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form action={handleSubmit} className="max-w-lg space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium uppercase tracking-wider text-pewter-pale">
            Manufacturer <span className="text-pewter-mid normal-case">(optional)</span>
          </label>
          <input
            name="manufacturer"
            defaultValue={item?.manufacturer ?? ''}
            className={inputClass}
            placeholder="e.g., Nemo"
          />
        </div>
        <div>
          <label className="block text-xs font-medium uppercase tracking-wider text-pewter-pale">Item</label>
          <input
            name="name"
            defaultValue={item?.name}
            required
            className={inputClass}
            placeholder="e.g., Hornet"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium uppercase tracking-wider text-pewter-pale">Category</label>
          <input
            name="category"
            defaultValue={item?.category}
            required
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs font-medium uppercase tracking-wider text-pewter-pale">Sub-Category</label>
          <input
            name="sub_category"
            defaultValue={item?.subCategory}
            required
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium uppercase tracking-wider text-pewter-pale">Weight (oz)</label>
          <input
            name="weight_oz"
            type="number"
            step="0.01"
            defaultValue={item?.weightOz ?? ''}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs font-medium uppercase tracking-wider text-pewter-pale">Tier</label>
          <select
            name="tier"
            defaultValue={item?.tier ?? ''}
            className={inputClass}
          >
            <option value="">None</option>
            <option value="1">Tier 1</option>
            <option value="2">Tier 2</option>
            <option value="3">Tier 3</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium uppercase tracking-wider text-pewter-pale">Parent Item</label>
        <select
          name="parent_item_id"
          defaultValue={item?.parentItemId ?? ''}
          className={inputClass}
        >
          <option value="">None (top-level item)</option>
          {parentItems.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-sm text-pewter-pale">
          <input type="checkbox" name="is_primary" defaultChecked={item?.isPrimary ?? true} className="accent-action" />
          Primary
        </label>
        <label className="flex items-center gap-2 text-sm text-pewter-pale">
          <input type="checkbox" name="is_weighed" defaultChecked={item?.isWeighed ?? false} className="accent-action" />
          Weighed
        </label>
        <label className="flex items-center gap-2 text-sm text-pewter-pale">
          <input type="checkbox" name="needs_charge" defaultChecked={item?.needsCharge ?? false} className="accent-action" />
          Needs Charge
        </label>
      </div>

      <div>
        <label className="block text-xs font-medium uppercase tracking-wider text-pewter-pale">Notes</label>
        <textarea
          name="notes"
          defaultValue={item?.notes ?? ''}
          rows={2}
          className={inputClass}
        />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded border border-action bg-forest px-4 py-2 text-sm font-medium text-white hover:bg-forest-light transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : item ? 'Update' : 'Add Item'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded border border-pewter-mid px-4 py-2 text-sm font-medium text-pewter-pale hover:border-pewter-pale transition-colors"
        >
          Cancel
        </button>
        {item && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={saving}
            className="ml-auto rounded border border-red-800 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-900/20 disabled:opacity-50"
          >
            Delete
          </button>
        )}
      </div>
    </form>
  )
}
