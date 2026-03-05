-- Enable RLS on all tables with open policies (single-user v1)
alter table gear_items enable row level security;
create policy "Allow all" on gear_items for all using (true) with check (true);

alter table outfits enable row level security;
create policy "Allow all" on outfits for all using (true) with check (true);

alter table outfit_items enable row level security;
create policy "Allow all" on outfit_items for all using (true) with check (true);

alter table trips enable row level security;
create policy "Allow all" on trips for all using (true) with check (true);

alter table trip_checklist enable row level security;
create policy "Allow all" on trip_checklist for all using (true) with check (true);
