-- 041_announcements_publish.sql
-- Lets TO staff publish and manage the mobile app's announcement feed, and
-- attach a hero photo. The `announcements` table is owned by the tourist
-- (Sinsay) app; its existing shape is deliberately preserved.
--
-- Shape (verified against the live project):
--   id uuid pk, title text not null, body text, image_url text,
--   active boolean default true, priority integer default 0,
--   start_date timestamptz, end_date timestamptz, created_at timestamptz.
-- `image_url` already exists, so no column changes are needed for the photo.
-- Reads were already opened to staff by 037; this migration adds the write
-- side, plus an optional event-date range (start_date/end_date stay reserved
-- for publish scheduling).
--
-- Idempotent: safe to re-run.
-- Apply in Supabase SQL Editor (service role / postgres), after 040.

-- Optional event window shown on the announcement hero (distinct from the
-- publish schedule in start_date/end_date).
alter table public.announcements
  add column if not exists event_start_date timestamptz,
  add column if not exists event_end_date timestamptz;

drop policy if exists "Staff can insert announcements" on public.announcements;
create policy "Staff can insert announcements"
  on public.announcements for insert with check (public.is_to_staff());
drop policy if exists "Staff can update announcements" on public.announcements;
create policy "Staff can update announcements"
  on public.announcements for update using (public.is_to_staff());
drop policy if exists "Staff can delete announcements" on public.announcements;
create policy "Staff can delete announcements"
  on public.announcements for delete using (public.is_to_staff());

grant select, insert, update, delete on public.announcements to authenticated;

-- Public bucket: the mobile app renders announcement heroes straight from
-- the stored URL, so no signing round-trip is needed on their side.
insert into storage.buckets (id, name, public)
values ('announcement-photos', 'announcement-photos', true)
on conflict (id) do nothing;

drop policy if exists "Staff can read announcement photos" on storage.objects;
create policy "Staff can read announcement photos"
  on storage.objects for select
  using (bucket_id = 'announcement-photos' and public.is_to_staff());
drop policy if exists "Staff can upload announcement photos" on storage.objects;
create policy "Staff can upload announcement photos"
  on storage.objects for insert
  with check (bucket_id = 'announcement-photos' and public.is_to_staff());
drop policy if exists "Staff can update announcement photos" on storage.objects;
create policy "Staff can update announcement photos"
  on storage.objects for update
  using (bucket_id = 'announcement-photos' and public.is_to_staff());

-- Verification probes (run after applying):
--   select column_name from information_schema.columns
--    where table_schema = 'public' and table_name = 'announcements'
--      and column_name like 'event_%';
--   select policyname, cmd from pg_policies
--    where schemaname = 'public' and tablename = 'announcements'
--    order by cmd, policyname;
--   select id, public from storage.buckets where id = 'announcement-photos';
--   select policyname, cmd from pg_policies
--    where schemaname = 'storage' and tablename = 'objects'
--      and policyname like '%announcement%'
--    order by policyname;
