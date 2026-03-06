import { pgTable, uuid, text, decimal, integer, boolean, timestamp, date, unique } from 'drizzle-orm/pg-core'

export const gearItems = pgTable('gear_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  manufacturer: text('manufacturer'),
  name: text('name').notNull(),
  category: text('category').notNull(),
  subCategory: text('sub_category').notNull(),
  weightOz: decimal('weight_oz'),
  tier: integer('tier'),
  isPrimary: boolean('is_primary').notNull().default(true),
  isWeighed: boolean('is_weighed').notNull().default(false),
  needsCharge: boolean('needs_charge').notNull().default(false),
  parentItemId: uuid('parent_item_id').references((): any => gearItems.id, { onDelete: 'set null' }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const outfits = pgTable('outfits', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const outfitItems = pgTable('outfit_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  outfitId: uuid('outfit_id').notNull().references(() => outfits.id, { onDelete: 'cascade' }),
  gearItemId: uuid('gear_item_id').notNull().references(() => gearItems.id, { onDelete: 'cascade' }),
}, (table) => ({
  uniqueOutfitGear: unique().on(table.outfitId, table.gearItemId),
}))

export const trips = pgTable('trips', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  outfitId: uuid('outfit_id').notNull().references(() => outfits.id, { onDelete: 'cascade' }),
  date: date('date'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const tripChecklist = pgTable('trip_checklist', {
  id: uuid('id').primaryKey().defaultRandom(),
  tripId: uuid('trip_id').notNull().references(() => trips.id, { onDelete: 'cascade' }),
  gearItemId: uuid('gear_item_id').notNull().references(() => gearItems.id, { onDelete: 'cascade' }),
  isPacked: boolean('is_packed').notNull().default(false),
  isCharged: boolean('is_charged').notNull().default(false),
}, (table) => ({
  uniqueTripGear: unique().on(table.tripId, table.gearItemId),
}))
