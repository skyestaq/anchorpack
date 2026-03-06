import { db } from '@/lib/db'
import { outfits, outfitItems, gearItems } from '@/lib/db/schema'
import { OutfitCard } from '@/components/outfit-card'
import Link from 'next/link'
import { eq, desc, count, sum } from 'drizzle-orm'

export default async function OutfitsPage() {
  const outfitsWithStats = await db
    .select({
      id: outfits.id,
      name: outfits.name,
      description: outfits.description,
      createdAt: outfits.createdAt,
      itemCount: count(outfitItems.id),
      totalWeightOz: sum(gearItems.weightOz),
    })
    .from(outfits)
    .leftJoin(outfitItems, eq(outfitItems.outfitId, outfits.id))
    .leftJoin(gearItems, eq(outfitItems.gearItemId, gearItems.id))
    .groupBy(outfits.id, outfits.name, outfits.description, outfits.createdAt)
    .orderBy(desc(outfits.createdAt))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-white">Outfits</h1>
        <Link
          href="/outfits/new"
          className="rounded border border-action bg-forest px-4 py-2 text-sm font-medium text-white hover:bg-forest-light transition-colors"
        >
          New Outfit
        </Link>
      </div>

      {outfitsWithStats.length === 0 ? (
        <div className="rounded-lg border border-pewter-mid bg-pewter-light p-8 text-center">
          <p className="text-sm text-pewter-pale">No outfits yet.</p>
          <Link href="/outfits/new" className="mt-2 inline-block text-sm font-medium text-action underline">
            Create your first outfit
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {outfitsWithStats.map((outfit) => (
            <OutfitCard
              key={outfit.id}
              id={outfit.id}
              name={outfit.name}
              description={outfit.description}
              itemCount={outfit.itemCount}
              totalWeightOz={parseFloat(outfit.totalWeightOz ?? '0')}
            />
          ))}
        </div>
      )}
    </div>
  )
}
