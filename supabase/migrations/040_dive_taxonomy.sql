-- 040_dive_taxonomy.sql
-- Adopts the new dive taxonomies dashboard-wide:
--   difficulty: Intro, Open Water, Advanced, Rescue, Divemaster, Instructor
--   site_type / dive_type: Scuba, Intro Dive, Fun Dive, Training, Freediver
--
-- Legacy site_type / dive_type values (Reef, Wreck, Wall, Drift, Night) are
-- retired: every one of those dives was a scuba dive, so existing rows are
-- backfilled to 'Scuba' and new writes are constrained to the new lists.
-- Difficulty needs no backfill (the old 5 values are a subset of the new 6).
--
-- Safe whether dive_sites came from 033 (has CHECKs) or 033b (doesn't):
-- drops are IF EXISTS, and the backfill runs before constraints are added
-- so ADD CONSTRAINT can never fail on legacy rows. No CHECK is added to
-- dive_manifests.dive_type (free-text column also written outside this
-- dashboard — constraining it could break other writers).
--
-- Apply in Supabase SQL Editor (service role / postgres). PostgREST caches
-- the schema — wait ~1 minute after applying before retrying saves.

-- 1. Retire legacy values (old taxonomy not needed going forward).
update public.dive_sites
set site_type = 'Scuba'
where site_type is not null
  and site_type not in
    ('Scuba', 'Intro Dive', 'Fun Dive', 'Training', 'Freediver');

update public.dive_manifests
set dive_type = 'Scuba'
where dive_type is not null
  and dive_type not in
    ('Scuba', 'Intro Dive', 'Fun Dive', 'Training', 'Freediver');

-- 2. Widen difficulty (adds Intro), replace site_type list.
alter table public.dive_sites
  drop constraint if exists dive_sites_difficulty_check;
alter table public.dive_sites
  add constraint dive_sites_difficulty_check
  check (difficulty in
    ('Intro', 'Open Water', 'Advanced', 'Rescue', 'Divemaster', 'Instructor'));

alter table public.dive_sites
  drop constraint if exists dive_sites_site_type_check;
alter table public.dive_sites
  add constraint dive_sites_site_type_check
  check (site_type in
    ('Scuba', 'Intro Dive', 'Fun Dive', 'Training', 'Freediver'));

-- Verification probe (run after applying):
--   select constraint_name from information_schema.table_constraints
--    where table_schema = 'public' and table_name = 'dive_sites'
--      and constraint_type = 'CHECK';
--   select distinct difficulty from public.dive_sites order by 1;
--   select distinct site_type from public.dive_sites order by 1;
--   select distinct dive_type from public.dive_manifests order by 1;
