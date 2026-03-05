import { db } from '@/lib/db'
import { outfits } from '@/lib/db/schema'
import { TripForm } from '@/components/trip-form'
import { Outfit } from '@/types/database'
import { asc } from 'drizzle-orm'

export default async function NewTripPage() {
  const allOutfits = await db
    .select()
    .from(outfits)
    .orderBy(asc(outfits.name))

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">New Trip</h1>
      <TripForm outfits={allOutfits as Outfit[]} />
    </div>
  )
}
