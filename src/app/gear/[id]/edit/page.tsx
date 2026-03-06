import { db } from '@/lib/db'
import { gearItems } from '@/lib/db/schema'
import { GearForm } from '@/components/gear-form'
import { GearItem } from '@/types/database'
import { eq, isNull, asc } from 'drizzle-orm'
import { notFound } from 'next/navigation'

export default async function EditGearPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [item] = await db
    .select()
    .from(gearItems)
    .where(eq(gearItems.id, id))
    .limit(1)

  if (!item) notFound()

  const parentItems = await db
    .select({ id: gearItems.id, name: gearItems.name })
    .from(gearItems)
    .where(isNull(gearItems.parentItemId))
    .orderBy(asc(gearItems.name))

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl text-white">Edit: {item.name}</h1>
      <GearForm
        item={item as GearItem}
        parentItems={parentItems as Pick<GearItem, 'id' | 'name'>[]}
      />
    </div>
  )
}
