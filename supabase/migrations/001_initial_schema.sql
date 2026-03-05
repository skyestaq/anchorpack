-- Gear items: master inventory
create table gear_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  sub_category text not null,
  weight_oz decimal,
  tier int,
  is_primary boolean not null default true,
  is_weighed boolean not null default false,
  needs_charge boolean not null default false,
  parent_item_id uuid references gear_items(id) on delete set null,
  notes text,
  created_at timestamptz not null default now()
);

-- Outfits: named gear loadouts
create table outfits (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

-- Join table: outfit <-> gear items
create table outfit_items (
  id uuid primary key default gen_random_uuid(),
  outfit_id uuid not null references outfits(id) on delete cascade,
  gear_item_id uuid not null references gear_items(id) on delete cascade,
  unique(outfit_id, gear_item_id)
);

-- Trips: tied to an outfit
create table trips (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  outfit_id uuid not null references outfits(id) on delete cascade,
  date date,
  created_at timestamptz not null default now()
);

-- Trip checklist: per-trip packing state
create table trip_checklist (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  gear_item_id uuid not null references gear_items(id) on delete cascade,
  is_packed boolean not null default false,
  is_charged boolean not null default false,
  unique(trip_id, gear_item_id)
);

-- Indexes for common queries
create index idx_gear_items_category on gear_items(category);
create index idx_gear_items_parent on gear_items(parent_item_id);
create index idx_outfit_items_outfit on outfit_items(outfit_id);
create index idx_outfit_items_gear on outfit_items(gear_item_id);
create index idx_trip_checklist_trip on trip_checklist(trip_id);
