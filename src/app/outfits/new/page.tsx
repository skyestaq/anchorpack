import { db } from '@/lib/db'
import { gearItems } from '@/lib/db/schema'
import { OutfitBuilder } from '@/components/outfit-builder'
import { GearItem } from '@/types/database'
import { asc } from 'drizzle-orm'

export default async function NewOutfitPage() {
  const items = await db
    .select()
    .from(gearItems)
    .orderBy(asc(gearItems.category), asc(gearItems.subCategory), asc(gearItems.name))

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">New Outfit</h1>
      <OutfitBuilder
        allItems={items as GearItem[]}
        initialSelectedIds={[]}
      />
    </div>
  )
}
