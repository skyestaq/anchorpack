import { db } from '@/lib/db'
import { trips, tripChecklist, gearItems } from '@/lib/db/schema'
import { TripChecklist } from '@/components/trip-checklist'
import { GearItem, TripChecklistItem } from '@/types/database'
import { eq } from 'drizzle-orm'
import { notFound } from 'next/navigation'

export default async function TripPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [trip] = await db
    .select()
    .from(trips)
    .where(eq(trips.id, id))
    .limit(1)

  if (!trip) notFound()

  const checklistRows = await db
    .select({
      checklistId: tripChecklist.id,
      tripId: tripChecklist.tripId,
      gearItemId: tripChecklist.gearItemId,
      isPacked: tripChecklist.isPacked,
      isCharged: tripChecklist.isCharged,
      gearId: gearItems.id,
      gearName: gearItems.name,
      gearCategory: gearItems.category,
      gearSubCategory: gearItems.subCategory,
      gearWeightOz: gearItems.weightOz,
      gearTier: gearItems.tier,
      gearIsPrimary: gearItems.isPrimary,
      gearIsWeighed: gearItems.isWeighed,
      gearNeedsCharge: gearItems.needsCharge,
      gearParentItemId: gearItems.parentItemId,
      gearNotes: gearItems.notes,
      gearCreatedAt: gearItems.createdAt,
    })
    .from(tripChecklist)
    .innerJoin(gearItems, eq(tripChecklist.gearItemId, gearItems.id))
    .where(eq(tripChecklist.tripId, id))
    .orderBy(gearItems.category, gearItems.name)

  const entries = checklistRows.map((row) => ({
    checklist: {
      id: row.checklistId,
      tripId: row.tripId,
      gearItemId: row.gearItemId,
      isPacked: row.isPacked,
      isCharged: row.isCharged,
    } as TripChecklistItem,
    gear: {
      id: row.gearId,
      name: row.gearName,
      category: row.gearCategory,
      subCategory: row.gearSubCategory,
      weightOz: row.gearWeightOz,
      tier: row.gearTier,
      isPrimary: row.gearIsPrimary,
      isWeighed: row.gearIsWeighed,
      needsCharge: row.gearNeedsCharge,
      parentItemId: row.gearParentItemId,
      notes: row.gearNotes,
      createdAt: row.gearCreatedAt,
    } as GearItem,
  }))

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">{trip.name}</h1>
        {trip.date && (
          <p className="text-sm text-gray-500">{trip.date}</p>
        )}
      </div>
      <TripChecklist
        tripId={id}
        entries={entries}
      />
    </div>
  )
}
