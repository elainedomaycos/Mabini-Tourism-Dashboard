-- ---------------------------------------------------------------------------
-- Migration 048: Establishment Analytics Real Data
-- Enhances public._to_establishment with date-scoped trip & diver counts,
-- accurate operator/resort credit balances, and pending application tracking.
-- ---------------------------------------------------------------------------

create or replace function public._to_establishment(p_from date, p_to date)
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with bounds as (
    select
      (p_from::timestamp at time zone 'Asia/Manila') as start_ts,
      ((p_to + 1)::timestamp at time zone 'Asia/Manila') as end_ts
  ),
  approved_resorts as (
    select distinct on (resort_name)
      resort_name, tourist_id, status
    from public.operator_applications
    order by resort_name, (lower(status) = 'approved') desc, created_at desc
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
    select m.id, m.operator_id, coalesce(d.divers, 0) as divers
    from public.dive_manifests m
    cross join bounds b
    left join (
      select manifest_id, count(*)::int as divers
      from public.manifest_divers group by manifest_id
    ) d on d.manifest_id = m.id
    where m.created_at >= b.start_ts and m.created_at < b.end_ts
  ),
  manifest_counts as (
    select n.name,
      count(*)::int as manifestos,
      coalesce(sum(m.divers), 0)::int as divers
    from current_m m
    join operator_names n on n.operator_id = m.operator_id
    group by n.name
  ),
  credit_balances as (
    select n.name,
      coalesce(sum(greatest(coalesce(i.total_passes, 0) - coalesce(i.remaining_passes, 0), 0)
        * coalesce(i.amount, 0)), 0) as credit_balance,
      coalesce(sum(coalesce(i.remaining_passes, 0)), 0)::int as remaining_credits
    from public.dive_pass_inventory i
    join operator_names n on n.operator_id = i.operator_id
    group by n.name
  )
  select jsonb_build_object(
    'total', (select count(*) from public.establishments),
    'active', (select count(*) from public.establishments where accredited is not false),
    'suspended', (select count(*) from public.establishments where accredited is false),
    'pendingApplications', (
      select count(*) from public.operator_applications where lower(status) = 'pending'
    ),
    'establishments', coalesce((
      select jsonb_agg(jsonb_build_object(
        'name', e.name,
        'owner', coalesce(nullif(trim(t.full_name), ''), 'Unknown owner'),
        'location', coalesce(e.location, ''),
        'status', (case when e.accredited is false then 'Suspended' else 'Active' end),
        'manifestos', coalesce(mc.manifestos, 0),
        'divers', coalesce(mc.divers, 0),
        'creditBalance', coalesce(cb.credit_balance, 0),
        'remainingCredits', coalesce(cb.remaining_credits, 0),
        'createdAt', (e.created_at at time zone 'Asia/Manila')::date
      ) order by coalesce(mc.manifestos, 0) desc, e.name)
      from public.establishments e
      left join approved_resorts ar on ar.resort_name = e.name
      left join public.tourists t on t.id = ar.tourist_id
      left join manifest_counts mc on mc.name = e.name
      left join credit_balances cb on cb.name = e.name
    ), '[]'::jsonb)
  );
$$;

revoke all on function public._to_establishment(date, date) from public, anon;
grant execute on function public._to_establishment(date, date) to authenticated;
