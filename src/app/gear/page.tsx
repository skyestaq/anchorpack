import { db } from '@/lib/db'
import { gearItems } from '@/lib/db/schema'
import { GearList } from '@/components/gear-list'
import { GearItem } from '@/types/database'
import Link from 'next/link'
import { asc } from 'drizzle-orm'

export default async function GearPage() {
  const items = await db
    .select()
    .from(gearItems)
    .orderBy(asc(gearItems.category), asc(gearItems.subCategory), asc(gearItems.name))

  const totalWeightOz = items.reduce((sum, i) => {
    const oz = i.weightOz ? parseFloat(String(i.weightOz)) : 0
    return sum + (isNaN(oz) ? 0 : oz)
  }, 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between max-w-[75%]">
        <div>
          <h1 className="font-display text-2xl text-white">Gear Inventory</h1>
          <p className="font-data text-sm text-pewter-pale">
            {items.length} items &middot; {(totalWeightOz / 16).toFixed(1)} lbs total
          </p>
        </div>
        <Link
          href="/gear/new"
          className="rounded border border-action bg-forest px-4 py-2 text-sm font-medium text-white hover:bg-forest-light transition-colors"
        >
          Add Item
        </Link>
      </div>
      <GearList items={items as GearItem[]} />
    </div>
  )
}
