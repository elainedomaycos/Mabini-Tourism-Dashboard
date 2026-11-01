-- ---------------------------------------------------------------------------
-- Migration 050: Overview Analytics Real Data
-- Enhances public._to_overview with resilient diver counting for today/yesterday,
-- robust pending queue counts, and expiring tourist passes tracking.
-- ---------------------------------------------------------------------------

create or replace function public._to_overview(p_from date, p_to date)
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
      (now() at time zone 'Asia/Manila')::date as today,
      (now() at time zone 'Asia/Manila')::date - 1 as yesterday,
      (p_from - (p_to - p_from + 1))::date as prev_from,
      (p_from - 1)::date as prev_to
  ),
  current_tourists as (
    select t.*,
      coalesce(t.date_accredited, (t.created_at at time zone 'Asia/Manila')::date) as reg_date
    from public.tourists t, bounds b
    where t.id <> auth.uid()
      and coalesce(t.date_accredited, (t.created_at at time zone 'Asia/Manila')::date)
        between p_from and p_to
  ),
  current_manifests as (
    select m.*, coalesce(d.divers, 0) as divers
    from public.dive_manifests m
    cross join bounds b
    left join (
      select manifest_id, count(*)::int as divers
      from public.manifest_divers
      group by manifest_id
    ) d on d.manifest_id = m.id
    where m.created_at >= b.start_ts and m.created_at < b.end_ts
  ),
  current_revenue as (
    select coalesce(sum(amount), 0) as total
    from public.payment_transactions, bounds b
    where lower(status) = 'verified'
      and created_at >= b.start_ts and created_at < b.end_ts
  ),
  prev_revenue as (
    select coalesce(sum(amount), 0) as total
    from public.payment_transactions, bounds b
    where lower(status) = 'verified'
      and (created_at at time zone 'Asia/Manila')::date between b.prev_from and b.prev_to
  ),
  daily as (
    select
      d.day::date as date,
      (select count(*) from current_tourists t where t.reg_date = d.day::date) as tourists,
      (select coalesce(sum(m.divers), 0) from current_manifests m
        where (m.created_at at time zone 'Asia/Manila')::date = d.day::date) as divers,
      (select coalesce(sum(p.amount), 0) from public.payment_transactions p
        where lower(p.status) = 'verified'
          and (p.created_at at time zone 'Asia/Manila')::date = d.day::date) as revenue
    from generate_series(p_from, p_to, interval '1 day') d(day)
  )
  select jsonb_build_object(
    'tourists', (select count(*) from current_tourists),
    'touristsPrev', (
      select count(*) from public.tourists t, bounds b
      where t.id <> auth.uid()
        and coalesce(t.date_accredited, (t.created_at at time zone 'Asia/Manila')::date)
          between b.prev_from and b.prev_to
    ),
    'activeIds', (
      select count(*) from public.tourists t, bounds b
      where t.id <> auth.uid()
        and lower(coalesce(t.status, '')) = 'active'
        and (t.renewal_date is null or t.renewal_date >= b.today)
    ),
    'todayDivers', (
      select coalesce(sum(coalesce(d.divers, 0)), 0)
      from public.dive_manifests m
      cross join bounds b
      left join (
        select manifest_id, count(*)::int as divers
        from public.manifest_divers
        group by manifest_id
      ) d on d.manifest_id = m.id
      where (m.created_at at time zone 'Asia/Manila')::date = b.today
    ),
    'yesterdayDivers', (
      select coalesce(sum(coalesce(d.divers, 0)), 0)
      from public.dive_manifests m
      cross join bounds b
      left join (
        select manifest_id, count(*)::int as divers
        from public.manifest_divers
        group by manifest_id
      ) d on d.manifest_id = m.id
      where (m.created_at at time zone 'Asia/Manila')::date = b.yesterday
    ),
    'approvedOperators', (
      select count(*) from public.operator_applications
      where lower(status) = 'approved'
    ),
    'activeSites', (
      select count(*) from public.dive_sites
      where lower(coalesce(status, 'active')) = 'active'
    ),
    'revenue', (select total from current_revenue),
    'revenuePrev', (select total from prev_revenue),
    'pendingReceipts', (
      select count(*) from public.payment_transactions where lower(status) = 'pending'
    ),
    'oldestPendingReceiptDays', (
      select coalesce(max(b.today - (created_at at time zone 'Asia/Manila')::date), 0)
      from public.payment_transactions, bounds b
      where lower(status) = 'pending'
    ),
    'pendingApplications', (
      select count(*) from public.operator_applications where lower(status) = 'pending'
    ),
    'oldestPendingAppDays', (
      select coalesce(max(b.today - (created_at at time zone 'Asia/Manila')::date), 0)
      from public.operator_applications, bounds b
      where lower(status) = 'pending'
    ),
    'expiringPasses', (
      select count(*) from public.tourists t, bounds b
      where t.id <> auth.uid()
        and lower(coalesce(t.status, '')) = 'active'
        and t.renewal_date > b.today
        and t.renewal_date <= b.today + 30
    ),
    'series', coalesce((
      select jsonb_agg(jsonb_build_object(
        'date', date, 'tourists', tourists, 'divers', divers, 'revenue', revenue
      ) order by date)
      from daily
    ), '[]'::jsonb),
    'nationality', coalesce((
      select jsonb_agg(jsonb_build_object('name', name, 'count', count) order by count desc)
      from (
        select coalesce(nullif(trim(nationality), ''), 'Unknown') as name, count(*) as count
        from current_tourists group by 1
      ) n
    ), '[]'::jsonb),
    'level', coalesce((
      select jsonb_agg(jsonb_build_object('name', name, 'count', count) order by count desc)
      from (
        select coalesce(nullif(trim(certification_level), ''), 'Unknown') as name, count(*) as count
        from current_tourists group by 1
      ) l
    ), '[]'::jsonb),
    'diveTypes', coalesce((
      select jsonb_agg(jsonb_build_object('name', name, 'count', count) order by count desc)
      from (
        select coalesce(nullif(trim(dive_type), ''), 'Unknown') as name, count(*) as count
        from current_manifests group by 1
      ) d
    ), '[]'::jsonb),
    'topSites', coalesce((
      select jsonb_agg(jsonb_build_object('name', name, 'divers', divers, 'manifests', manifests) order by divers desc)
      from (
        select coalesce(nullif(trim(location), ''), 'Unknown') as name,
          coalesce(sum(divers), 0) as divers, count(*) as manifests
        from current_manifests group by 1
      ) s
    ), '[]'::jsonb),
    'sites', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', coalesce(s.site_code, s.id::text),
        'name', s.name,
        'barangay', coalesce(s.barangay, ''),
        'types', coalesce(
          to_jsonb(s) -> 'site_types',
          case when coalesce(to_jsonb(s) ->> 'site_type', '') <> ''
            then jsonb_build_array(to_jsonb(s) ->> 'site_type')
            else '[]'::jsonb end
        ),
        'status', (case lower(coalesce(s.status, 'active'))
          when 'restricted' then 'Restricted'
          when 'seasonal' then 'Seasonal'
          else 'Active' end),
        'dives', (
          select coalesce(sum(m.divers), 0)
          from current_manifests m where m.location = s.name
        ),
        'description', coalesce(s.description, ''),
        'depth', coalesce(s.depth_range, ''),
        'difficulty', coalesce(s.difficulty, '')
      ) order by s.name)
      from public.dive_sites s
    ), '[]'::jsonb)
  );
$$;

revoke all on function public._to_overview(date, date) from public, anon;
grant execute on function public._to_overview(date, date) to authenticated;
