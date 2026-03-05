export interface GearItem {
  id: string
  name: string
  category: string
  sub_category: string
  weight_oz: number | null
  tier: number | null
  is_primary: boolean
  is_weighed: boolean
  needs_charge: boolean
  parent_item_id: string | null
  notes: string | null
  created_at: string
}

export interface Outfit {
  id: string
  name: string
  description: string | null
  created_at: string
}

export interface OutfitItem {
  id: string
  outfit_id: string
  gear_item_id: string
}

export interface Trip {
  id: string
  name: string
  outfit_id: string
  date: string | null
  created_at: string
}

export interface TripChecklistItem {
  id: string
  trip_id: string
  gear_item_id: string
  is_packed: boolean
  is_charged: boolean
}
