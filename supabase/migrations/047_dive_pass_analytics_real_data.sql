-- 047_dive_pass_analytics_real_data.sql
-- Real data aggregation for Dive Pass Analytics:
-- 1. Date-scoped credits used and prior period delta.
-- 2. Pending verification queue summary (count, total ₱ amount, and oldest days).
-- 3. Pass tier volume and revenue contribution.
-- Idempotent: safe to re-run.
-- Apply in Supabase SQL Editor (service role / postgres), after 044, 045, 046.

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
    select coalesce(sum(amount), 0)::numeric as total
    from public.payment_transactions, bounds b
    where lower(status) = 'verified'
      and created_at >= b.start_ts and created_at < b.end_ts
  ),
  prev_revenue as (
    select coalesce(sum(amount), 0)::numeric as total
    from public.payment_transactions, bounds b
    where lower(status) = 'verified'
      and (created_at at time zone 'Asia/Manila')::date between b.prev_from and b.prev_to
  ),
  lifetime as (
    select
      coalesce(sum(total_passes), 0)::int as purchased,
      coalesce(sum(remaining_passes), 0)::int as remaining,
      coalesce(sum(total_passes - remaining_passes), 0)::int as used
    from public.dive_pass_inventory
  ),
  current_inv as (
    select i.*, greatest(coalesce(i.total_passes, 0) - coalesce(i.remaining_passes, 0), 0) as used
    from public.dive_pass_inventory i, bounds b
    where i.created_at >= b.start_ts and i.created_at < b.end_ts
  ),
  prev_inv as (
    select i.*, greatest(coalesce(i.total_passes, 0) - coalesce(i.remaining_passes, 0), 0) as used
    from public.dive_pass_inventory i, bounds b
    where (i.created_at at time zone 'Asia/Manila')::date between b.prev_from and b.prev_to
  ),
  pending_summary as (
    select
      count(*)::int as count,
      coalesce(sum(amount), 0)::numeric as amount,
      coalesce(max(b.today - (created_at at time zone 'Asia/Manila')::date), 0)::int as oldest_days
    from public.payment_transactions, bounds b
    where lower(status) = 'pending'
  ),
  revenue_daily as (
    select (created_at at time zone 'Asia/Manila')::date as date,
      coalesce(sum(amount), 0)::numeric as revenue
    from public.payment_transactions, bounds b
    where lower(status) = 'verified'
      and created_at >= b.start_ts and created_at < b.end_ts
    group by 1
  )
  select jsonb_build_object(
    'revenue', (select total from current_revenue),
    'revenuePrev', (select total from prev_revenue),
    'creditsUsed', (select coalesce(sum(used), 0)::int from current_inv),
    'creditsUsedPrev', (select coalesce(sum(used), 0)::int from prev_inv),
    'lifetimeUsed', (select used from lifetime),
    'purchased', (select coalesce(sum(total_passes), 0)::int from current_inv),
    'remaining', (select coalesce(sum(remaining_passes), 0)::int from current_inv),
    'lifetimePurchased', (select purchased from lifetime),
    'lifetimeRemaining', (select remaining from lifetime),
    'pendingReceipts', (select count from pending_summary),
    'pendingAmount', (select amount from pending_summary),
    'oldestPendingReceiptDays', (select oldest_days from pending_summary),
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
          coalesce(sum(total_passes), 0)::int as purchased,
          coalesce(sum(remaining_passes), 0)::int as remaining,
          coalesce(sum(amount), 0)::numeric as amount
        from current_inv group by 1, 2
      ) i
    ), '[]'::jsonb),
    'passTypes', coalesce((
      select jsonb_agg(jsonb_build_object(
        'type', type, 'purchased', purchased, 'used', used, 'amount', amount
      ) order by type)
      from (
        select coalesce(nullif(trim(pass_type), ''), 'Other') as type,
          coalesce(sum(total_passes), 0)::int as purchased,
          coalesce(sum(used), 0)::int as used,
          coalesce(sum(amount), 0)::numeric as amount
        from current_inv group by 1
      ) p
    ), '[]'::jsonb)
  );
$$;

revoke all on function public._to_dive_pass(date, date) from public, anon, authenticated;

comment on function public._to_dive_pass is
  'Staff dashboard aggregate for dive passes with date-scoped credits, pending review amounts, and daily revenue metrics.';
