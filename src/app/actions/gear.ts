'use server'

import { db } from '@/lib/db'
import { gearItems } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export async function createGearItem(formData: FormData) {
  const weightOzRaw = formData.get('weight_oz') as string
  const tierRaw = formData.get('tier') as string
  const parentItemIdRaw = formData.get('parent_item_id') as string

  await db.insert(gearItems).values({
    manufacturer: (formData.get('manufacturer') as string) || null,
    name: formData.get('name') as string,
    category: formData.get('category') as string,
    subCategory: formData.get('sub_category') as string,
    weightOz: weightOzRaw && !isNaN(parseFloat(weightOzRaw)) ? parseFloat(weightOzRaw).toString() : null,
    tier: tierRaw ? parseInt(tierRaw) : null,
    isPrimary: formData.get('is_primary') === 'on',
    isWeighed: formData.get('is_weighed') === 'on',
    needsCharge: formData.get('needs_charge') === 'on',
    parentItemId: parentItemIdRaw || null,
    notes: (formData.get('notes') as string) || null,
  })
  revalidatePath('/gear')
}

export async function updateGearItem(id: string, formData: FormData) {
  const weightOzRaw = formData.get('weight_oz') as string
  const tierRaw = formData.get('tier') as string
  const parentItemIdRaw = formData.get('parent_item_id') as string

  await db.update(gearItems)
    .set({
      manufacturer: (formData.get('manufacturer') as string) || null,
      name: formData.get('name') as string,
      category: formData.get('category') as string,
      subCategory: formData.get('sub_category') as string,
      weightOz: weightOzRaw && !isNaN(parseFloat(weightOzRaw)) ? parseFloat(weightOzRaw).toString() : null,
      tier: tierRaw ? parseInt(tierRaw) : null,
      isPrimary: formData.get('is_primary') === 'on',
      isWeighed: formData.get('is_weighed') === 'on',
      needsCharge: formData.get('needs_charge') === 'on',
      parentItemId: parentItemIdRaw || null,
      notes: (formData.get('notes') as string) || null,
    })
    .where(eq(gearItems.id, id))
  revalidatePath('/gear')
}

export async function deleteGearItem(id: string) {
  await db.delete(gearItems).where(eq(gearItems.id, id))
  revalidatePath('/gear')
}
