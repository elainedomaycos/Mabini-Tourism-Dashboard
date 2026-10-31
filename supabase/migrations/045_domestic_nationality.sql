create or replace function public._to_tourist(p_from date, p_to date)
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
  base as (
    select
      t.id,
      coalesce(t.date_accredited, (t.created_at at time zone 'Asia/Manila')::date) as reg_date,
      coalesce(nullif(trim(t.nationality), ''), 'Unknown') as nationality,
      coalesce(nullif(trim(t.certification_level), ''), 'Unknown') as level,
      (lower(trim(coalesce(t.nationality, ''))) in ('philippines', 'ph', 'pilipinas', 'filipino', 'filipina')) as domestic
    from public.tourists t
    where t.id <> auth.uid()
  ),
  current_t as (
    select * from base where reg_date between p_from and p_to
  ),
  prev_t as (
    select * from base, bounds b where reg_date between b.prev_from and b.prev_to
  ),
  first_seen as (
    select nationality, min(reg_date) as first_date
    from base group by nationality
  ),
  current_divers as (
    select coalesce(sum(x.divers), 0) as total from (
      select m.id, count(md.*)::int as divers
      from public.dive_manifests m
      left join public.manifest_divers md on md.manifest_id = m.id
      cross join bounds b
      where m.created_at >= b.start_ts and m.created_at < b.end_ts
      group by m.id
    ) x
  ),
  prev_divers as (
    select coalesce(sum(x.divers), 0) as total from (
      select m.id, count(md.*)::int as divers
      from public.dive_manifests m
      left join public.manifest_divers md on md.manifest_id = m.id
      cross join bounds b
      where (m.created_at at time zone 'Asia/Manila')::date between b.prev_from and b.prev_to
      group by m.id
    ) x
  ),
  daily as (
    select d.day::date as date,
      count(t.id)::int as all_count,
      count(t.id) filter (where t.domestic)::int as domestic,
      count(t.id) filter (where not t.domestic)::int as international
    from generate_series(p_from, p_to, interval '1 day') d(day)
    left join current_t t on t.reg_date = d.day::date
    group by d.day
  )
  select jsonb_build_object(
    'total', (select count(*) from current_t),
    'totalPrev', (select count(*) from prev_t),
    'divers', (select total from current_divers),
    'diversPrev', (select total from prev_divers),
    'newNationalities', (
      select count(*) from first_seen where first_date between p_from and p_to
    ),
    'totals', jsonb_build_object(
      'all', (select count(*) from current_t),
      'domestic', (select count(*) from current_t where domestic),
      'international', (select count(*) from current_t where not domestic),
      'prevAll', (select count(*) from prev_t),
      'prevDomestic', (select count(*) from prev_t where domestic),
      'prevInternational', (select count(*) from prev_t where not domestic)
    ),
    'nationalities', coalesce((
      select jsonb_agg(jsonb_build_object(
        'name', nationality, 'count', count, 'domestic', domestic
      ) order by count desc)
      from (
        select nationality, domestic, count(*) as count
        from current_t group by nationality, domestic
      ) n
    ), '[]'::jsonb),
    'levels', coalesce((
      select jsonb_agg(jsonb_build_object(
        'name', level, 'count', count, 'domestic', domestic
      ) order by count desc)
      from (
        select level, domestic, count(*) as count
        from current_t group by level, domestic
      ) l
    ), '[]'::jsonb),
    'nationalityLevels', coalesce((
      select jsonb_agg(jsonb_build_object(
        'nationality', nationality, 'level', level, 'domestic', domestic, 'count', count
      ) order by count desc)
      from (
        select nationality, level, domestic, count(*) as count
        from current_t group by nationality, level, domestic
      ) nl
    ), '[]'::jsonb),
    'daily', coalesce((
      select jsonb_agg(jsonb_build_object(
        'date', date, 'all', all_count, 'domestic', domestic,
        'international', international
      ) order by date)
      from daily
    ), '[]'::jsonb)
  );
$$;
