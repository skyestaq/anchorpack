import { db } from '@/lib/db'
import { trips, outfits } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import Link from 'next/link'

export default async function TripsPage() {
  const allTrips = await db
    .select({
      id: trips.id,
      name: trips.name,
      date: trips.date,
      outfitName: outfits.name,
    })
    .from(trips)
    .leftJoin(outfits, eq(trips.outfitId, outfits.id))
    .orderBy(desc(trips.createdAt))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-white">Trips</h1>
        <Link
          href="/trips/new"
          className="rounded border border-action bg-forest px-4 py-2 text-sm font-medium text-white hover:bg-forest-light transition-colors"
        >
          New Trip
        </Link>
      </div>

      {allTrips.length === 0 ? (
        <div className="rounded-lg border border-pewter-mid bg-pewter-light p-8 text-center">
          <p className="text-sm text-pewter-pale">No trips yet.</p>
          <Link href="/trips/new" className="mt-2 inline-block text-sm font-medium text-action underline">
            Plan your first trip
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {allTrips.map((trip) => (
            <Link
              key={trip.id}
              href={`/trips/${trip.id}`}
              className="block rounded-lg border border-pewter-mid bg-pewter-light p-4 transition-colors hover:border-action"
            >
              <h3 className="font-display text-sm text-white">{trip.name}</h3>
              <div className="mt-1 flex gap-4 font-data text-xs text-pewter-pale">
                {trip.outfitName && <span>Outfit: {trip.outfitName}</span>}
                {trip.date && <span>{trip.date}</span>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
