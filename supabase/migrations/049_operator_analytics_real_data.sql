-- ---------------------------------------------------------------------------
-- Migration 049: Operator Analytics Real Data
-- Enhances public._to_operator with activePrev comparison, accurate
-- operator revenue totals, diver rollups, and recent manifest audits.
-- ---------------------------------------------------------------------------

create or replace function public._to_operator(p_from date, p_to date)
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
  operator_map as (
    select distinct on (tourist_id)
      tourist_id, resort_name
    from public.operator_applications
    order by tourist_id, (lower(status) = 'approved') desc, created_at desc
  ),
  operator_names as (
    select t.id as operator_id,
      coalesce(nullif(trim(om.resort_name), ''), nullif(trim(t.full_name), ''), 'Unknown operator') as name
    from public.tourists t
    left join operator_map om on om.tourist_id = t.id
  ),
  current_m as (
    select m.id, m.operator_id, m.location, m.created_at,
      coalesce(d.divers, m.divers, 0) as divers
    from public.dive_manifests m
    cross join bounds b
    left join (
      select manifest_id, count(*)::int as divers
      from public.manifest_divers group by manifest_id
    ) d on d.manifest_id = m.id
    where m.created_at >= b.start_ts and m.created_at < b.end_ts
  ),
  prev_m as (
    select m.id, m.operator_id, coalesce(d.divers, m.divers, 0) as divers
    from public.dive_manifests m
    cross join bounds b
    left join (
      select manifest_id, count(*)::int as divers
      from public.manifest_divers group by manifest_id
    ) d on d.manifest_id = m.id
    where (m.created_at at time zone 'Asia/Manila')::date between b.prev_from and b.prev_to
  ),
  manifest_rows as (
    select n.name,
      count(*)::int as manifestos,
      coalesce(sum(m.divers), 0) as divers
    from current_m m
    join operator_names n on n.operator_id = m.operator_id
    group by n.name
  ),
  inventory_rows as (
    select n.name,
      coalesce(sum(greatest(coalesce(i.total_passes, 0) - coalesce(i.remaining_passes, 0), 0)), 0) as credits,
      coalesce(sum(i.total_passes), 0) as purchased,
      coalesce(sum(i.remaining_passes), 0) as remaining
    from public.dive_pass_inventory i
    join operator_names n on n.operator_id = i.operator_id
    group by n.name
  ),
  revenue_rows as (
    select n.name, coalesce(sum(p.amount), 0) as revenue
    from public.payment_transactions p
    cross join bounds b
    join operator_names n on n.operator_id = p.operator_id
    where lower(p.status) = 'verified'
      and p.created_at >= b.start_ts and p.created_at < b.end_ts
    group by n.name
  ),
  names as (
    select name from manifest_rows
    union select name from inventory_rows
    union select name from revenue_rows
  ),
  recent as (
    select name, id, site, divers, date from (
      select n.name, m.id::text as id,
        coalesce(nullif(trim(m.location), ''), 'Unknown site') as site,
        coalesce(d.divers, m.divers, 0)::int as divers,
        (m.created_at at time zone 'Asia/Manila')::date as date,
        row_number() over (partition by n.name order by m.created_at desc) as rn
      from public.dive_manifests m
      join operator_names n on n.operator_id = m.operator_id
      left join (
        select manifest_id, count(*)::int as divers
        from public.manifest_divers group by manifest_id
      ) d on d.manifest_id = m.id
    ) r where rn <= 5
  )
  select jsonb_build_object(
    'active', (select count(distinct operator_id) from current_m),
    'activePrev', (select count(distinct operator_id) from prev_m),
    'operators', greatest(
      (select count(distinct tourist_id) from public.operator_applications where lower(status) = 'approved'),
      (select count(*) from names)
    ),
    'manifestos', (select coalesce(sum(manifestos), 0) from manifest_rows),
    'manifestosPrev', (select count(*) from prev_m),
    'divers', (select coalesce(sum(divers), 0) from manifest_rows),
    'diversPrev', (select coalesce(sum(divers), 0) from prev_m),
    'revenue', (select coalesce(sum(revenue), 0) from revenue_rows),
    'revenuePrev', (
      select coalesce(sum(p.amount), 0)
      from public.payment_transactions p, bounds b
      where lower(p.status) = 'verified'
        and (p.created_at at time zone 'Asia/Manila')::date between b.prev_from and b.prev_to
    ),
    'rows', coalesce((
      select jsonb_agg(jsonb_build_object(
        'name', n.name,
        'manifestos', coalesce(mr.manifestos, 0),
        'divers', coalesce(mr.divers, 0),
        'credits', coalesce(ir.credits, 0),
        'purchased', coalesce(ir.purchased, 0),
        'remaining', coalesce(ir.remaining, 0),
        'revenue', coalesce(rr.revenue, 0),
        'recent', coalesce((
          select jsonb_agg(jsonb_build_object(
            'id', r.id, 'site', r.site, 'divers', r.divers, 'date', r.date
          ) order by r.date desc)
          from recent r where r.name = n.name
        ), '[]'::jsonb)
      ) order by coalesce(rr.revenue, 0) desc, coalesce(mr.manifestos, 0) desc, n.name)
      from names n
      left join manifest_rows mr on mr.name = n.name
      left join inventory_rows ir on ir.name = n.name
      left join revenue_rows rr on rr.name = n.name
    ), '[]'::jsonb)
  );
$$;

revoke all on function public._to_operator(date, date) from public, anon;
grant execute on function public._to_operator(date, date) to authenticated;
