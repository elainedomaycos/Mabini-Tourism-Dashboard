-- 042_dive_sites_multi_type.sql
-- Dive sites can now carry more than one type (e.g. Scuba + Fun Dive).
--
-- Additive: the existing single-value `site_type` column is left intact and
-- keeps holding the primary (first) type, so its CHECK and every existing
-- reader stay valid. The full multi-type list lives in a new `site_types
-- text[]` column the dashboard writes alongside it.
--
-- Idempotent: safe to re-run.
-- Apply in Supabase SQL Editor (service role / postgres), after 041.
-- PostgREST caches the schema — wait ~1 minute after applying before saves.

-- 1. New array column.
alter table public.dive_sites
  add column if not exists site_types text[];

-- 2. Backfill: every existing site becomes a single-element array.
update public.dive_sites
set site_types = array[site_type]
where site_types is null
  and site_type is not null;

-- 3. Element validation: every entry must be one of the current taxonomy.
alter table public.dive_sites
  drop constraint if exists dive_sites_site_types_check;
alter table public.dive_sites
  add constraint dive_sites_site_types_check
  check (
    site_types is null
    or (
      array_length(site_types, 1) >= 1
      and site_types <@ array['Scuba','Intro Dive','Fun Dive','Training','Freediver']::text[]
    )
  );

-- Verification probe (run after applying):
--   select site_code, site_type, site_types from public.dive_sites order by 1;
