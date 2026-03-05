import { parse } from 'csv-parse/sync'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { eq } from 'drizzle-orm'
import * as schema from '../src/lib/db/schema.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// ---------------------------------------------------------------------------
// Database setup
// ---------------------------------------------------------------------------

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  console.error('ERROR: DATABASE_URL environment variable is not set.')
  process.exit(1)
}

const sql = neon(databaseUrl)
const db = drizzle(sql, { schema })

// ---------------------------------------------------------------------------
// CSV parsing
// ---------------------------------------------------------------------------

const csvPath = join(__dirname, '..', 'GRC-Gear-List-Notion-Import.csv')
const csvContent = readFileSync(csvPath, 'utf-8')

interface CsvRow {
  'Item Name': string
  Category: string
  'Sub-Category': string
  LBs: string
  OZs: string
  Tier: string
  'Primary / Optional': string
  Weighed: string
  'Needs Charge': string
  Packed: string
  Notes: string
}

const rows: CsvRow[] = parse(csvContent, {
  columns: true,
  skip_empty_lines: true,
  trim: true,
  relax_column_count: true,
})

// ---------------------------------------------------------------------------
// Notes cleanup helpers
// ---------------------------------------------------------------------------

/**
 * Strips import-specific metadata from the notes string and returns a clean
 * notes value (or null if nothing meaningful remains).
 *
 * Patterns removed (case-insensitive where appropriate):
 *   - "parent bag" (and surrounding punctuation / dashes)
 *   - "sub-items not individually weighed"
 *   - "sub-item of <name>" (where <name> is anything up to a separator or end)
 *   - "sub-item — Optional" / "sub-item - Optional"
 *   - "needs charge"
 *   - "needs weigh"
 *   - "validate"
 */
function cleanNotes(raw: string): string | null {
  let notes = raw.trim()

  // Remove known metadata phrases (order matters — longer phrases first)
  notes = notes.replace(/sub-items not individually weighed/gi, '')
  notes = notes.replace(/sub-item of [^,\n—–-]+/gi, '')
  notes = notes.replace(/sub-item\s*[—–-]+\s*Optional/gi, '')
  notes = notes.replace(/sub-item/gi, '')
  notes = notes.replace(/parent bag/gi, '')
  notes = notes.replace(/needs charge/gi, '')
  notes = notes.replace(/needs weigh/gi, '')
  notes = notes.replace(/\bvalidate\b/gi, '')

  // Clean up leftover separators and whitespace
  notes = notes.replace(/[—–-]+/g, ' ')   // collapse em/en dashes and hyphens
  notes = notes.replace(/\s{2,}/g, ' ')   // collapse multiple spaces
  notes = notes.trim()

  return notes.length > 0 ? notes : null
}

// ---------------------------------------------------------------------------
// Determine which rows are parent items
// ---------------------------------------------------------------------------

/** Names of items that are explicitly "parent bag" containers */
const PARENT_ITEM_NAMES = new Set([
  'Food Bag',
  'Quick Access Pack (includes bag)',
  'Campsite Pack (includes bag)',
  'Clothes Bag',
])

/**
 * Extract the parent name from a "sub-item of X" note.
 * Returns the matched parent name string, or null.
 */
function extractParentName(notes: string): string | null {
  const match = notes.match(/sub-item of ([^,\n—–]+)/i)
  if (!match) return null
  return match[1].trim()
}

/**
 * Map from CSV parent item name → the inserted UUID.
 * Built during pass 1 and consumed in pass 2.
 */
const parentNameToId = new Map<string, string>()

// ---------------------------------------------------------------------------
// Pass 1: insert all rows with parent_item_id = null
// ---------------------------------------------------------------------------

console.log('Pass 1: inserting all gear items…')

let insertedCount = 0
let skippedCount = 0

// We need the inserted IDs so we can match them in pass 2.
// Collect sub-item rows (item id → raw parent name) for pass 2.
const subItemsForPass2: Array<{ id: string; parentName: string }> = []

for (const row of rows) {
  const name = row['Item Name']?.trim()

  // Skip empty rows
  if (!name) {
    skippedCount++
    continue
  }

  const category = row['Category']?.trim() || ''
  const subCategory = row['Sub-Category']?.trim() || ''
  const rawOzs = row['OZs']?.trim()
  const rawTier = row['Tier']?.trim()
  const rawPrimaryOptional = row['Primary / Optional']?.trim()
  const rawWeighed = row['Weighed']?.trim()
  const rawNeedsCharge = row['Needs Charge']?.trim()
  const rawNotes = row['Notes']?.trim() || ''

  // Weight
  const ozsNum = rawOzs ? parseFloat(rawOzs) : NaN
  const weightOz =
    isNaN(ozsNum) || ozsNum === 0 ? null : ozsNum.toString()

  // Tier
  const tierNum = rawTier ? parseInt(rawTier, 10) : NaN
  const tier = isNaN(tierNum) ? null : tierNum

  // Booleans
  const isPrimary = rawPrimaryOptional === 'Primary'
  const isWeighed = rawWeighed === 'TRUE'
  const needsCharge =
    rawNeedsCharge === 'TRUE' ||
    /needs charge/i.test(rawNotes)

  // Clean notes
  const notes = cleanNotes(rawNotes)

  const [inserted] = await db
    .insert(schema.gearItems)
    .values({
      name,
      category,
      subCategory,
      weightOz: weightOz ?? undefined,
      tier: tier ?? undefined,
      isPrimary,
      isWeighed,
      needsCharge,
      parentItemId: null,
      notes: notes ?? undefined,
    })
    .returning({ id: schema.gearItems.id })

  insertedCount++

  // Build the parent name→id map
  const isParentByName = PARENT_ITEM_NAMES.has(name)
  const isParentByNote = /parent bag/i.test(rawNotes)
  if (isParentByName || isParentByNote) {
    parentNameToId.set(name, inserted.id)
    console.log(`  Parent item registered: "${name}" → ${inserted.id}`)
  }

  // Detect sub-item relationship for pass 2
  const parentName = extractParentName(rawNotes)
  if (parentName) {
    subItemsForPass2.push({ id: inserted.id, parentName })
  }
}

console.log(
  `Pass 1 complete: ${insertedCount} items inserted, ${skippedCount} rows skipped.\n`
)

// ---------------------------------------------------------------------------
// Pass 2: update parent_item_id for sub-items
// ---------------------------------------------------------------------------

console.log('Pass 2: linking sub-items to parents…')

let linkedCount = 0
let unresolvedCount = 0

for (const { id, parentName } of subItemsForPass2) {
  // Try exact match first
  let parentId = parentNameToId.get(parentName)

  // If no exact match, try a case-insensitive partial match
  if (!parentId) {
    for (const [key, val] of parentNameToId.entries()) {
      if (key.toLowerCase().includes(parentName.toLowerCase()) ||
          parentName.toLowerCase().includes(key.toLowerCase())) {
        parentId = val
        break
      }
    }
  }

  if (!parentId) {
    console.warn(`  WARNING: no parent found for name "${parentName}" (item id: ${id})`)
    unresolvedCount++
    continue
  }

  await db
    .update(schema.gearItems)
    .set({ parentItemId: parentId })
    .where(eq(schema.gearItems.id, id))

  linkedCount++
}

console.log(
  `Pass 2 complete: ${linkedCount} sub-items linked, ${unresolvedCount} unresolved.\n`
)

console.log('Import finished successfully.')
