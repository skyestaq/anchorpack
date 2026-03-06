import { db } from '@/lib/db'
import { outfits, outfitItems, gearItems } from '@/lib/db/schema'
import { OutfitBuilder } from '@/components/outfit-builder'
import { GearItem } from '@/types/database'
import { eq, asc } from 'drizzle-orm'
import { notFound } from 'next/navigation'

export default async function EditOutfitPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [outfit] = await db
    .select()
    .from(outfits)
    .where(eq(outfits.id, id))
    .limit(1)

  if (!outfit) notFound()

  const allItems = await db
    .select()
    .from(gearItems)
    .orderBy(asc(gearItems.category), asc(gearItems.subCategory), asc(gearItems.name))

  const selectedRows = await db
    .select({ gearItemId: outfitItems.gearItemId })
    .from(outfitItems)
    .where(eq(outfitItems.outfitId, id))

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl text-white">Edit Outfit</h1>
      <OutfitBuilder
        outfitId={id}
        outfitName={outfit.name}
        outfitDescription={outfit.description ?? ''}
        allItems={allItems as GearItem[]}
        initialSelectedIds={selectedRows.map((r) => r.gearItemId)}
      />
    </div>
  )
}
