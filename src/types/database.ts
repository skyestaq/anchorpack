import type { InferSelectModel } from 'drizzle-orm'
import type { gearItems, outfits, outfitItems, trips, tripChecklist } from '@/lib/db/schema'

export type GearItem = InferSelectModel<typeof gearItems>
export type Outfit = InferSelectModel<typeof outfits>
export type OutfitItem = InferSelectModel<typeof outfitItems>
export type Trip = InferSelectModel<typeof trips>
export type TripChecklistItem = InferSelectModel<typeof tripChecklist>
