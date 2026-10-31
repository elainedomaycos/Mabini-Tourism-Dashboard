-- 044_reporting_metrics.sql
-- Read-only aggregate RPCs for the staff dashboard.
--
-- Why: the client previously fetched capped row sets (200/500) and computed
-- analytics in the browser. That silently under-counted once the data grew.
-- The functions below aggregate in Postgres over the full tables and return
-- one JSON object per dashboard section.
--
-- Reporting timezone is Asia/Manila. Dive manifests have no dive_date column
-- yet, so their created_at day is used (the same definition the dashboard has
-- always shown). Credit usage has no ledger yet, so lifetime used/remaining
-- values remain snapshots and are labelled as such in the UI.
--
-- Security: staff-only. The public dispatcher is SECURITY DEFINER so it can
-- aggregate across RLS-protected tables, but it explicitly checks
-- public.is_to_staff() and anon/public execute is revoked.
--
-- Apply in Supabase SQL Editor (service role / postgres). Idempotent.
--
-- Verification probes (run after applying, signed in as staff):
--   select public.to_metrics('overview', current_date - 29, current_date);
--   select public.to_metrics('tourist', current_date - 29, current_date);
--   select public.to_metrics('report', current_date - 29, current_date);
--   select public.to_tourist_sample(current_date - 29, current_date,
--     'USA', null, '{}'::text[]);
-- Anonymous callers must receive 42501 / permission denied.

-- ---------------------------------------------------------------------------
-- OVERVIEW
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
      select coalesce(sum(x.divers), 0) from (
        select m.id, count(md.*)::int as divers
        from public.dive_manifests m
        left join public.manifest_divers md on md.manifest_id = m.id
        cross join bounds b
        where (m.created_at at time zone 'Asia/Manila')::date = b.today
        group by m.id
      ) x
    ),
    'yesterdayDivers', (
      select coalesce(sum(x.divers), 0) from (
        select m.id, count(md.*)::int as divers
        from public.dive_manifests m
        left join public.manifest_divers md on md.manifest_id = m.id
        cross join bounds b
        where (m.created_at at time zone 'Asia/Manila')::date = b.yesterday
        group by m.id
      ) x
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

-- ---------------------------------------------------------------------------
-- TOURIST ANALYTICS
-- ---------------------------------------------------------------------------
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
      (lower(trim(coalesce(t.nationality, ''))) in ('philippines', 'ph', 'pilipinas')) as domestic
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

-- ---------------------------------------------------------------------------
-- DIVE ACTIVITY ANALYTICS
-- ---------------------------------------------------------------------------
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
      from (
        select (case extract(month from created_at at time zone 'Asia/Manila')::int
          when 12 then 'Winter' when 1 then 'Winter' when 2 then 'Winter'
          when 3 then 'Spring' when 4 then 'Spring' when 5 then 'Spring'
          when 6 then 'Summer' when 7 then 'Summer' when 8 then 'Summer'
          else 'Autumn' end) as season,
          coalesce(sum(divers), 0) as divers, count(*) as trips
        from current_m group by 1
      ) s
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
    ), '[]'::jsonb)
  );
$$;

-- ---------------------------------------------------------------------------
-- DIVE PASS ANALYTICS
-- ---------------------------------------------------------------------------
create or replace function public._to_dive_pass(p_from date, p_to date)
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
      (p_from - (p_to - p_from + 1))::date as prev_from,
      (p_from - 1)::date as prev_to
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
  lifetime as (
    select
      coalesce(sum(total_passes), 0) as purchased,
      coalesce(sum(remaining_passes), 0) as remaining,
      coalesce(sum(total_passes - remaining_passes), 0) as used
    from public.dive_pass_inventory
  ),
  current_inv as (
    select i.*, greatest(coalesce(i.total_passes, 0) - coalesce(i.remaining_passes, 0), 0) as used
    from public.dive_pass_inventory i, bounds b
    where i.created_at >= b.start_ts and i.created_at < b.end_ts
  ),
  revenue_daily as (
    select (created_at at time zone 'Asia/Manila')::date as date,
      coalesce(sum(amount), 0) as revenue
    from public.payment_transactions, bounds b
    where lower(status) = 'verified'
      and created_at >= b.start_ts and created_at < b.end_ts
    group by 1
  )
  select jsonb_build_object(
    'revenue', (select total from current_revenue),
    'revenuePrev', (select total from prev_revenue),
    'creditsUsed', (select used from lifetime),
    'purchased', (select purchased from lifetime),
    'remaining', (select remaining from lifetime),
    'pendingReceipts', (
      select count(*) from public.payment_transactions where lower(status) = 'pending'
    ),
    'oldestPendingReceiptDays', (
      select coalesce(max(b.today - (created_at at time zone 'Asia/Manila')::date), 0)
      from public.payment_transactions, bounds b
      where lower(status) = 'pending'
    ),
    'dailyRevenue', coalesce((
      select jsonb_agg(jsonb_build_object('date', date, 'revenue', revenue) order by date)
      from revenue_daily
    ), '[]'::jsonb),
    'inventory', coalesce((
      select jsonb_agg(jsonb_build_object(
        'date', date, 'passType', pass_type, 'purchased', purchased,
        'remaining', remaining, 'amount', amount
      ) order by date)
      from (
        select (created_at at time zone 'Asia/Manila')::date as date,
          coalesce(nullif(trim(pass_type), ''), 'Other') as pass_type,
          coalesce(sum(total_passes), 0) as purchased,
          coalesce(sum(remaining_passes), 0) as remaining,
          coalesce(sum(amount), 0) as amount
        from current_inv group by 1, 2
      ) i
    ), '[]'::jsonb),
    'passTypes', coalesce((
      select jsonb_agg(jsonb_build_object(
        'type', type, 'purchased', purchased, 'used', used, 'amount', amount
      ) order by type)
      from (
        select coalesce(nullif(trim(pass_type), ''), 'Other') as type,
          coalesce(sum(total_passes), 0) as purchased,
          coalesce(sum(used), 0) as used,
          coalesce(sum(amount), 0) as amount
        from current_inv group by 1
      ) p
    ), '[]'::jsonb)
  );
$$;

-- ---------------------------------------------------------------------------
-- ESTABLISHMENT ANALYTICS
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
  manifest_counts as (
    select n.name, count(*)::int as manifestos
    from public.dive_manifests m
    cross join bounds b
    join operator_names n on n.operator_id = m.operator_id
    where m.created_at >= b.start_ts and m.created_at < b.end_ts
    group by n.name
  ),
  credit_balances as (
    select n.name,
      coalesce(sum(greatest(coalesce(i.total_passes, 0) - coalesce(i.remaining_passes, 0), 0)
        * coalesce(i.amount, 0)), 0) as credit_balance
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
        'creditBalance', coalesce(cb.credit_balance, 0),
        'createdAt', (e.created_at at time zone 'Asia/Manila')::date
      ) order by e.name)
      from public.establishments e
      left join approved_resorts ar on ar.resort_name = e.name
      left join public.tourists t on t.id = ar.tourist_id
      left join manifest_counts mc on mc.name = e.name
      left join credit_balances cb on cb.name = e.name
    ), '[]'::jsonb)
  );
$$;

-- ---------------------------------------------------------------------------
-- OPERATOR ANALYTICS
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
      coalesce(d.divers, 0) as divers
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
        m.divers,
        (m.created_at at time zone 'Asia/Manila')::date as date,
        row_number() over (partition by n.name order by m.created_at desc) as rn
      from current_m m
      join operator_names n on n.operator_id = m.operator_id
    ) r where rn <= 5
  )
  select jsonb_build_object(
    'active', (select count(*) from manifest_rows where manifestos > 0),
    'operators', (select count(*) from names),
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
      ) order by coalesce(mr.manifestos, 0) desc, n.name)
      from names n
      left join manifest_rows mr on mr.name = n.name
      left join inventory_rows ir on ir.name = n.name
      left join revenue_rows rr on rr.name = n.name
    ), '[]'::jsonb)
  );
$$;

-- ---------------------------------------------------------------------------
-- REPORTS (daily rows; the client folds them into day/week/month)
-- ---------------------------------------------------------------------------
create or replace function public._to_report(p_from date, p_to date)
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
  tourist_daily as (
    select coalesce(t.date_accredited, (t.created_at at time zone 'Asia/Manila')::date) as date,
      count(*)::int as tourists
    from public.tourists t, bounds b
    where t.id <> auth.uid()
      and coalesce(t.date_accredited, (t.created_at at time zone 'Asia/Manila')::date)
        between p_from and p_to
    group by 1
  ),
  operator_daily as (
    select (created_at at time zone 'Asia/Manila')::date as date, count(*)::int as operators
    from public.operator_applications, bounds b
    where created_at >= b.start_ts and created_at < b.end_ts
    group by 1
  ),
  manifest_daily as (
    select m.date, count(*)::int as manifestos,
      coalesce(sum(d.divers), 0) as divers
    from (
      select m.id, (m.created_at at time zone 'Asia/Manila')::date as date
      from public.dive_manifests m, bounds b
      where m.created_at >= b.start_ts and m.created_at < b.end_ts
    ) m
    left join (
      select manifest_id, count(*)::int as divers
      from public.manifest_divers group by manifest_id
    ) d on d.manifest_id = m.id
    group by m.date
  ),
  revenue_daily as (
    select (created_at at time zone 'Asia/Manila')::date as date,
      coalesce(sum(amount), 0) as revenue
    from public.payment_transactions, bounds b
    where lower(status) = 'verified'
      and created_at >= b.start_ts and created_at < b.end_ts
    group by 1
  )
  select jsonb_build_object(
    'daily', coalesce((
      select jsonb_agg(jsonb_build_object(
        'date', d.day::date,
        'tourists', coalesce(t.tourists, 0),
        'operators', coalesce(o.operators, 0),
        'manifestos', coalesce(m.manifestos, 0),
        'divers', coalesce(m.divers, 0),
        'revenue', coalesce(r.revenue, 0)
      ) order by d.day)
      from generate_series(p_from, p_to, interval '1 day') d(day)
      left join tourist_daily t on t.date = d.day::date
      left join operator_daily o on o.date = d.day::date
      left join manifest_daily m on m.date = d.day::date
      left join revenue_daily r on r.date = d.day::date
    ), '[]'::jsonb)
  );
$$;

-- ---------------------------------------------------------------------------
-- OVERVIEW DRILLDOWN SAMPLE (staff-visible names, capped at five)
-- ---------------------------------------------------------------------------
create or replace function public.to_tourist_sample(
  p_from date,
  p_to date,
  p_nationality text default null,
  p_level text default null,
  p_exclude_nationalities text[] default '{}'::text[]
)
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with rows as (
    select
      coalesce(nullif(trim(t.full_name), ''), 'Unnamed tourist') as name,
      coalesce(nullif(trim(t.nationality), ''), 'Unknown') as nationality,
      coalesce(nullif(trim(t.certification_level), ''), '—') as level,
      coalesce(t.status, 'Active') as status,
      coalesce(t.date_accredited, (t.created_at at time zone 'Asia/Manila')::date) as reg_date,
      t.created_at
    from public.tourists t
    where public.is_to_staff()
      and t.id <> auth.uid()
      and coalesce(t.date_accredited, (t.created_at at time zone 'Asia/Manila')::date)
        between p_from and p_to
      and (p_nationality is null
        or lower(trim(coalesce(t.nationality, ''))) = lower(trim(p_nationality)))
      and (p_level is null
        or case lower(trim(p_level))
             when 'intro' then t.certification_level ilike '%intro%'
             when 'open water' then t.certification_level ilike '%open%'
             when 'advanced' then t.certification_level ilike '%advanced%'
             when 'rescue' then t.certification_level ilike '%rescue%'
             when 'divemaster' then t.certification_level ilike '%master%'
             when 'instructor' then t.certification_level ilike '%instructor%'
             else lower(trim(coalesce(t.certification_level, ''))) = lower(trim(p_level))
           end)
      and not (lower(trim(coalesce(t.nationality, ''))) = any(
        select lower(trim(e.nat))
        from unnest(coalesce(p_exclude_nationalities, '{}'::text[])) as e(nat)
      ))
    order by t.created_at desc
    limit 5
  )
  select jsonb_build_object(
    'rows', coalesce((
      select jsonb_agg(jsonb_build_object(
        'name', name, 'nationality', nationality, 'level', level, 'status', status
      ) order by created_at desc)
      from rows
    ), '[]'::jsonb)
  );
$$;

-- ---------------------------------------------------------------------------
-- PUBLIC DISPATCHER
-- ---------------------------------------------------------------------------
create or replace function public.to_metrics(
  p_section text,
  p_from date,
  p_to date
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_section text := lower(trim(coalesce(p_section, '')));
begin
  if not public.is_to_staff() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  if p_from is null or p_to is null or p_from > p_to then
    raise exception 'Invalid metrics date range' using errcode = '22023';
  end if;

  if v_section = 'overview' then
    return public._to_overview(p_from, p_to);
  elsif v_section = 'tourist' then
    return public._to_tourist(p_from, p_to);
  elsif v_section = 'dive_activity' then
    return public._to_dive_activity(p_from, p_to);
  elsif v_section = 'dive_pass' then
    return public._to_dive_pass(p_from, p_to);
  elsif v_section = 'establishment' then
    return public._to_establishment(p_from, p_to);
  elsif v_section = 'operator' then
    return public._to_operator(p_from, p_to);
  elsif v_section = 'report' then
    return public._to_report(p_from, p_to);
  end if;

  raise exception 'Unknown metrics section: %', p_section using errcode = '22023';
end;
$$;

-- ---------------------------------------------------------------------------
-- GRANTS
-- ---------------------------------------------------------------------------
revoke all on function public.to_metrics(text, date, date) from public, anon;
grant execute on function public.to_metrics(text, date, date) to authenticated;

revoke all on function public.to_tourist_sample(date, date, text, text, text[]) from public, anon;
grant execute on function public.to_tourist_sample(date, date, text, text, text[]) to authenticated;

revoke all on function public._to_overview(date, date) from public, anon, authenticated;
revoke all on function public._to_tourist(date, date) from public, anon, authenticated;
revoke all on function public._to_dive_activity(date, date) from public, anon, authenticated;
revoke all on function public._to_dive_pass(date, date) from public, anon, authenticated;
revoke all on function public._to_establishment(date, date) from public, anon, authenticated;
revoke all on function public._to_operator(date, date) from public, anon, authenticated;
revoke all on function public._to_report(date, date) from public, anon, authenticated;

comment on function public.to_metrics(text, date, date) is
  'Staff dashboard aggregates. Sections: overview, tourist, dive_activity, dive_pass, establishment, operator, report.';
