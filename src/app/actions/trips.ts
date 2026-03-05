'use server'

import { db } from '@/lib/db'
import { trips, tripChecklist, outfitItems } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createTrip(name: string, outfitId: string, date: string | null) {
  const [trip] = await db
    .insert(trips)
    .values({ name, outfitId, date: date || null })
    .returning({ id: trips.id })

  // Populate checklist from outfit items
  const outfitGearItems = await db
    .select({ gearItemId: outfitItems.gearItemId })
    .from(outfitItems)
    .where(eq(outfitItems.outfitId, outfitId))

  if (outfitGearItems.length > 0) {
    await db.insert(tripChecklist).values(
      outfitGearItems.map((oi) => ({
        tripId: trip.id,
        gearItemId: oi.gearItemId,
        isPacked: false,
        isCharged: false,
      }))
    )
  }

  revalidatePath('/trips')
  redirect(`/trips/${trip.id}`)
}

export async function deleteTrip(id: string) {
  await db.delete(trips).where(eq(trips.id, id))
  revalidatePath('/trips')
  redirect('/trips')
}
