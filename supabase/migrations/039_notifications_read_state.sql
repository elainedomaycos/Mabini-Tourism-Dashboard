-- 039_notifications_read_state.sql
-- Lets TO staff mark notifications read from the dashboard bell.
--
-- 037 already opened SELECT on public.notifications to staff. Read state was
-- the missing half: the bell panel persisted nothing, so "mark read" was
-- in-memory only and reset on every reload. Three additive changes here —
-- no table shape change, no INSERT/UPDATE/DELETE on the content columns.
--
-- is_read is GLOBAL, not per-recipient: the table has no recipient column
-- (notifications are a broadcast feed from the tourist-facing app), so one
-- staffer marking a row read clears it for the whole office. That is the
-- intended semantics for a shared queue — it means "someone handled this".
--
-- Idempotent: safe to re-run.
-- Apply in Supabase SQL Editor (service role / postgres), after 037.

-- 1. Write access for the read flag only.
drop policy if exists "TO staff mark notifications read" on public.notifications;
create policy "TO staff mark notifications read"
  on public.notifications for update using (public.is_to_staff());

-- Column-scoped grant: staff may flip is_read, and nothing else. Without the
-- column list this would be a blanket UPDATE on title/body/type/tourist_id,
-- which the dashboard has no legitimate reason to rewrite.
grant update (is_read) on public.notifications to authenticated;

-- 2. Realtime push, so the bell count updates without a reload. 037 added
-- announcements to the publication but omitted notifications. Without this
-- the client subscription silently never fires and the bell looks static.
-- If the table is already a member this errors harmlessly with
-- "relation is already member of publication" — skip that statement then.
alter publication supabase_realtime add table public.notifications;

-- Verification probes (run after applying):
--   select policyname, cmd from pg_policies
--    where schemaname = 'public' and tablename = 'notifications'
--    order by policyname, cmd;
--   select grantee, privilege_type, column_name
--    from information_schema.column_table_privileges
--    where table_schema = 'public' and table_name = 'notifications'
--      and privilege_type = 'UPDATE';
--   select tablename from pg_publication_tables
--    where pubname = 'supabase_realtime' and tablename = 'notifications';
--
-- Expected: one SELECT + one UPDATE policy; UPDATE grant scoped to is_read
-- only; one publication row.