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
        <h1 className="text-2xl font-bold">Trips</h1>
        <Link
          href="/trips/new"
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
        >
          New Trip
        </Link>
      </div>

      {allTrips.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
          <p className="text-sm text-gray-500">No trips yet.</p>
          <Link href="/trips/new" className="mt-2 inline-block text-sm font-medium text-gray-900 underline">
            Plan your first trip
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {allTrips.map((trip) => (
            <Link
              key={trip.id}
              href={`/trips/${trip.id}`}
              className="block rounded-lg border border-gray-200 bg-white p-4 hover:border-gray-300 hover:shadow-sm transition-shadow"
            >
              <h3 className="font-semibold text-gray-900">{trip.name}</h3>
              <div className="mt-1 flex gap-4 text-xs text-gray-500">
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
