-- Shared dashboard images used by QA Scores Rank MTD and the three daily cards.
-- Safe to run after the initial DocuTool migration.

create table if not exists public.dashboard_media (
  slot text primary key check (
    slot in ('qa_scores_rank_mtd', 'puzzle_of_day', 'caregiver_of_day', 'sop_quiz_of_day')
  ),
  image_path text check (image_path is null or char_length(image_path) between 1 and 1024),
  answer text check (answer is null or char_length(answer) <= 4000),
  reveal_at timestamptz,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.dashboard_media enable row level security;

grant select on public.dashboard_media to anon, authenticated;
grant insert, update, delete on public.dashboard_media to authenticated;

drop policy if exists "published dashboard media is public" on public.dashboard_media;
create policy "published dashboard media is public"
on public.dashboard_media for select
to anon, authenticated
using (is_published);

drop policy if exists "admins can read all dashboard media" on public.dashboard_media;
create policy "admins can read all dashboard media"
on public.dashboard_media for select
to authenticated
using (coalesce((select auth.jwt())->'app_metadata'->>'docutool_role', '') = 'admin');

drop policy if exists "admins can insert dashboard media" on public.dashboard_media;
create policy "admins can insert dashboard media"
on public.dashboard_media for insert
to authenticated
with check (coalesce((select auth.jwt())->'app_metadata'->>'docutool_role', '') = 'admin');

drop policy if exists "admins can update dashboard media" on public.dashboard_media;
create policy "admins can update dashboard media"
on public.dashboard_media for update
to authenticated
using (coalesce((select auth.jwt())->'app_metadata'->>'docutool_role', '') = 'admin')
with check (coalesce((select auth.jwt())->'app_metadata'->>'docutool_role', '') = 'admin');

drop policy if exists "admins can delete dashboard media" on public.dashboard_media;
create policy "admins can delete dashboard media"
on public.dashboard_media for delete
to authenticated
using (coalesce((select auth.jwt())->'app_metadata'->>'docutool_role', '') = 'admin');

drop trigger if exists dashboard_media_set_updated_at on public.dashboard_media;
create trigger dashboard_media_set_updated_at
before update on public.dashboard_media
for each row execute function private.set_updated_at();

insert into public.dashboard_media (slot, is_published)
values
  ('qa_scores_rank_mtd', true),
  ('puzzle_of_day', true),
  ('caregiver_of_day', true),
  ('sop_quiz_of_day', true)
on conflict (slot) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'dashboard-media',
  'dashboard-media',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "dashboard media images are public" on storage.objects;
create policy "dashboard media images are public"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'dashboard-media');

drop policy if exists "admins can upload dashboard media images" on storage.objects;
create policy "admins can upload dashboard media images"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'dashboard-media'
  and coalesce((select auth.jwt())->'app_metadata'->>'docutool_role', '') = 'admin'
);

drop policy if exists "admins can update dashboard media images" on storage.objects;
create policy "admins can update dashboard media images"
on storage.objects for update
to authenticated
using (
  bucket_id = 'dashboard-media'
  and coalesce((select auth.jwt())->'app_metadata'->>'docutool_role', '') = 'admin'
)
with check (
  bucket_id = 'dashboard-media'
  and coalesce((select auth.jwt())->'app_metadata'->>'docutool_role', '') = 'admin'
);

drop policy if exists "admins can delete dashboard media images" on storage.objects;
create policy "admins can delete dashboard media images"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'dashboard-media'
  and coalesce((select auth.jwt())->'app_metadata'->>'docutool_role', '') = 'admin'
);
