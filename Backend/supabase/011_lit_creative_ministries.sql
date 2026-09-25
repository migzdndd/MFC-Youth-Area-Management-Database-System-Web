-- LIT Creative Ministries Services
-- Run in Supabase SQL editor to seed the 5 LIT Creative Ministries for all Areas.

with creative_ministry(name) as (
  values
    ('Music'),
    ('Dance'),
    ('Creative Writing'),
    ('Graphics & Promo'),
    ('Photography & Videography')
)
insert into public.services (area_id, name, is_active)
select area.id, creative_ministry.name, true
from public.areas as area
cross join creative_ministry
on conflict (area_id, name) do update
set is_active = true,
    updated_at = now();
