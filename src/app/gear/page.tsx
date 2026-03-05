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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gear Inventory</h1>
          <p className="text-sm text-gray-500">
            {items.length} items &middot; {(totalWeightOz / 16).toFixed(1)} lbs total
          </p>
        </div>
        <Link
          href="/gear/new"
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
        >
          Add Item
        </Link>
      </div>
      <GearList items={items as GearItem[]} />
    </div>
  )
}
