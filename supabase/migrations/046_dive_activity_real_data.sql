-- 046_dive_activity_real_data.sql
-- Real data aggregation for Dive Activity Analytics:
-- 1. Real hourly launch curves based on manifest filing timestamp (Asia/Manila).
-- 2. Real depth range distribution joined from the dive_sites registry.
-- 3. Philippine tropical tourism seasons (Amihan, Summer Peak, Habagat) instead of temperate 4-seasons.
-- Idempotent: safe to re-run.
-- Apply in Supabase SQL Editor (service role / postgres), after 044 & 045.

create or replace function public._to_dive_activity(p_from date, p_to date)
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with bounds as (
    select
      (p_from::timestamp at time zone 'Asia/Manila') as start_ts,
      ((p_to + 1)::timestamp at time zone 'Asia/Manila') as end_ts,
      (p_from - (p_to - p_from + 1))::date as prev_from,
      (p_from - 1)::date as prev_to
  ),
  current_m as (
    select m.*, coalesce(d.divers, 0) as divers
    from public.dive_manifests m
    cross join bounds b
    left join (
      select manifest_id, count(*)::int as divers
      from public.manifest_divers group by manifest_id
    ) d on d.manifest_id = m.id
    where m.created_at >= b.start_ts and m.created_at < b.end_ts
  ),
  prev_m as (
    select m.id, coalesce(d.divers, 0) as divers
    from public.dive_manifests m
    cross join bounds b
    left join (
      select manifest_id, count(*)::int as divers
      from public.manifest_divers group by manifest_id
    ) d on d.manifest_id = m.id
    where (m.created_at at time zone 'Asia/Manila')::date between b.prev_from and b.prev_to
  ),
  daily as (
    select (created_at at time zone 'Asia/Manila')::date as date,
      count(*)::int as manifests, coalesce(sum(divers), 0) as divers
    from current_m group by 1
  ),
  hourly as (
    select
      to_char(h, 'FM00') || ':00' as hour,
      coalesce(count(m.id), 0)::int as manifests,
      coalesce(sum(m.divers), 0)::int as dives
    from generate_series(5, 18) as h
    left join current_m m
      on extract(hour from (m.created_at at time zone 'Asia/Manila'))::int = h
    group by h
    order by h
  ),
  depths as (
    select
      coalesce(nullif(trim(s.depth_range), ''), '0–18m (Open Water)') as range,
      count(m.id)::int as count,
      coalesce(sum(m.divers), 0)::int as divers
    from current_m m
    left join public.dive_sites s
      on lower(trim(s.name)) = lower(trim(m.location))
    group by 1
    order by count desc
  ),
  seasonal as (
    select
      (case
        when extract(month from created_at at time zone 'Asia/Manila')::int in (11, 12, 1, 2)
          then 'Amihan (Dry & Calm)'
        when extract(month from created_at at time zone 'Asia/Manila')::int in (3, 4, 5)
          then 'Summer (Peak Season)'
        else 'Habagat (Monsoon/Low)'
      end) as season,
      coalesce(sum(divers), 0)::int as divers,
      count(*)::int as trips
    from current_m
    group by 1
  )
  select jsonb_build_object(
    'divers', (select coalesce(sum(divers), 0) from current_m),
    'diversPrev', (select coalesce(sum(divers), 0) from prev_m),
    'manifests', (select count(*) from current_m),
    'manifestsPrev', (select count(*) from prev_m),
    'sitesUsed', (select count(distinct location) from current_m where location is not null),
    'unverified', (select count(*) from current_m where verified is not true),
    'daily', coalesce((
      select jsonb_agg(jsonb_build_object(
        'date', date, 'manifests', manifests, 'divers', divers
      ) order by date)
      from daily
    ), '[]'::jsonb),
    'types', coalesce((
      select jsonb_agg(jsonb_build_object('name', name, 'count', count) order by count desc)
      from (
        select coalesce(nullif(trim(dive_type), ''), 'Unknown') as name, count(*) as count
        from current_m group by 1
      ) t
    ), '[]'::jsonb),
    'siteTypes', coalesce((
      select jsonb_agg(jsonb_build_object(
        'site', site, 'type', type, 'divers', divers
      ) order by site)
      from (
        select coalesce(nullif(trim(location), ''), 'Unknown') as site,
          coalesce(nullif(trim(dive_type), ''), 'Unknown') as type,
          coalesce(sum(divers), 0) as divers
        from current_m group by 1, 2
      ) st
    ), '[]'::jsonb),
    'seasonal', coalesce((
      select jsonb_agg(jsonb_build_object(
        'season', season, 'divers', divers, 'trips', trips
      ) order by season)
      from seasonal
    ), '[]'::jsonb),
    'capacity', coalesce((
      select jsonb_agg(jsonb_build_object(
        'site', site, 'maxCapacity', max_capacity, 'actualDives', actual_dives
      ) order by actual_dives desc)
      from (
        select coalesce(nullif(trim(location), ''), 'Unknown') as site,
          coalesce(sum(max_divers), 0) as max_capacity,
          coalesce(sum(divers), 0) as actual_dives
        from current_m group by 1
      ) c
    ), '[]'::jsonb),
    'hourly', coalesce((
      select jsonb_agg(jsonb_build_object(
        'hour', hour, 'manifests', manifests, 'dives', dives
      ) order by hour)
      from hourly
    ), '[]'::jsonb),
    'depths', coalesce((
      select jsonb_agg(jsonb_build_object(
        'range', range, 'count', count, 'divers', divers
      ) order by count desc)
      from depths
    ), '[]'::jsonb)
  );
$$;

revoke all on function public._to_dive_activity(date, date) from public, anon, authenticated;

comment on function public._to_dive_activity is
  'Staff dashboard aggregate for dive activity with real hourly launch curves, site depth ranges, and Philippine marine seasonality.';
