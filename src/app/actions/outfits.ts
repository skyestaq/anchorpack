'use server'

import { db } from '@/lib/db'
import { outfits, outfitItems } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createOutfit(name: string, description: string, gearItemIds: string[]) {
  const [outfit] = await db
    .insert(outfits)
    .values({ name, description: description || null })
    .returning({ id: outfits.id })

  if (gearItemIds.length > 0) {
    await db.insert(outfitItems).values(
      gearItemIds.map((gearItemId) => ({ outfitId: outfit.id, gearItemId }))
    )
  }
  revalidatePath('/outfits', 'layout')
  redirect('/outfits')
}

export async function updateOutfit(id: string, name: string, description: string, gearItemIds: string[]) {
  // neon-http driver doesn't support transactions; use batch() for atomic multi-statement execution.
  const updateStmt = db.update(outfits)
    .set({ name, description: description || null })
    .where(eq(outfits.id, id))
  const deleteStmt = db.delete(outfitItems).where(eq(outfitItems.outfitId, id))

  if (gearItemIds.length > 0) {
    const insertStmt = db.insert(outfitItems).values(
      gearItemIds.map((gearItemId) => ({ outfitId: id, gearItemId }))
    )
    await db.batch([updateStmt, deleteStmt, insertStmt])
  } else {
    await db.batch([updateStmt, deleteStmt])
  }
  revalidatePath('/outfits', 'layout')
  redirect('/outfits')
}

export async function deleteOutfit(id: string) {
  await db.delete(outfits).where(eq(outfits.id, id))
  revalidatePath('/outfits', 'layout')
  redirect('/outfits')
}
