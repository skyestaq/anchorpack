import { db } from '@/lib/db'
import { outfits, outfitItems, gearItems } from '@/lib/db/schema'
import { OutfitCard } from '@/components/outfit-card'
import Link from 'next/link'
import { eq, desc } from 'drizzle-orm'

export default async function OutfitsPage() {
  // Fetch all outfits
  const allOutfits = await db
    .select()
    .from(outfits)
    .orderBy(desc(outfits.createdAt))

  // For each outfit, get item count and total weight
  const outfitsWithStats = await Promise.all(
    allOutfits.map(async (outfit) => {
      const items = await db
        .select({ weightOz: gearItems.weightOz })
        .from(outfitItems)
        .innerJoin(gearItems, eq(outfitItems.gearItemId, gearItems.id))
        .where(eq(outfitItems.outfitId, outfit.id))

      const totalWeightOz = items.reduce((sum, i) => {
        const oz = i.weightOz ? parseFloat(String(i.weightOz)) : 0
        return sum + (isNaN(oz) ? 0 : oz)
      }, 0)

      return { ...outfit, itemCount: items.length, totalWeightOz }
    })
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Outfits</h1>
        <Link
          href="/outfits/new"
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
        >
          New Outfit
        </Link>
      </div>

      {outfitsWithStats.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
          <p className="text-sm text-gray-500">No outfits yet.</p>
          <Link href="/outfits/new" className="mt-2 inline-block text-sm font-medium text-gray-900 underline">
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
              totalWeightOz={outfit.totalWeightOz}
            />
          ))}
        </div>
      )}
    </div>
  )
}
