import { db } from '@/lib/db'
import { gearItems } from '@/lib/db/schema'
import { GearForm } from '@/components/gear-form'
import { GearItem } from '@/types/database'
import { isNull, asc } from 'drizzle-orm'

export default async function NewGearPage() {
  const parentItems = await db
    .select({ id: gearItems.id, name: gearItems.name })
    .from(gearItems)
    .where(isNull(gearItems.parentItemId))
    .orderBy(asc(gearItems.name))

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl text-white">Add Gear Item</h1>
      <GearForm parentItems={parentItems as Pick<GearItem, 'id' | 'name'>[]} />
    </div>
  )
}
