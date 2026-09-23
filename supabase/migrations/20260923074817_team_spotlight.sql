-- A single, replaceable weekly spotlight. Drafts are only readable by admins.
create table public.team_spotlight (
  id smallint primary key default 1 check (id = 1),
  employee_name text not null check (char_length(employee_name) between 1 and 100),
  team text not null default '' check (char_length(team) <= 100),
  week_label text not null default '' check (char_length(week_label) <= 50),
  hook text not null check (char_length(hook) between 1 and 180),
  intro text not null check (char_length(intro) between 1 and 500),
  fun_fact text not null default '' check (char_length(fun_fact) <= 250),
  qa jsonb not null default '[]'::jsonb check (jsonb_typeof(qa) = 'array' and jsonb_array_length(qa) <= 3),
  image_path text check (image_path is null or char_length(image_path) between 1 and 1024),
  is_approved boolean not null default false,
  is_published boolean not null default false,
  updated_at timestamptz not null default now(),
  constraint approved_before_publication check (not is_published or (is_approved and jsonb_array_length(qa) > 0))
);

alter table public.team_spotlight enable row level security;
grant select on public.team_spotlight to anon, authenticated;
grant insert, update, delete on public.team_spotlight to authenticated;

create policy "published team spotlight is visible"
on public.team_spotlight for select to anon, authenticated
using (is_published);

create policy "admins can read team spotlight drafts"
on public.team_spotlight for select to authenticated
using (coalesce((select auth.jwt())->'app_metadata'->>'docutool_role', '') = 'admin');

create policy "admins can create team spotlight"
on public.team_spotlight for insert to authenticated
with check (coalesce((select auth.jwt())->'app_metadata'->>'docutool_role', '') = 'admin');

create policy "admins can edit team spotlight"
on public.team_spotlight for update to authenticated
using (coalesce((select auth.jwt())->'app_metadata'->>'docutool_role', '') = 'admin')
with check (coalesce((select auth.jwt())->'app_metadata'->>'docutool_role', '') = 'admin');

create policy "admins can remove team spotlight"
on public.team_spotlight for delete to authenticated
using (coalesce((select auth.jwt())->'app_metadata'->>'docutool_role', '') = 'admin');

create trigger team_spotlight_set_updated_at
before update on public.team_spotlight
for each row execute function private.set_updated_at();

-- Photos are private while draft. Visitors can obtain a temporary signed URL
-- only for the published portrait. Previously issued URLs expire after one hour.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('team-spotlight', 'team-spotlight', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "published spotlight photo is readable"
on storage.objects for select to anon, authenticated
using (
  bucket_id = 'team-spotlight'
  and exists (
    select 1 from public.team_spotlight
    where image_path = name and is_published
  )
);

create policy "admins can read draft spotlight photos"
on storage.objects for select to authenticated
using (
  bucket_id = 'team-spotlight'
  and coalesce((select auth.jwt())->'app_metadata'->>'docutool_role', '') = 'admin'
);

create policy "admins can upload spotlight photos"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'team-spotlight'
  and coalesce((select auth.jwt())->'app_metadata'->>'docutool_role', '') = 'admin'
);

create policy "admins can delete spotlight photos"
on storage.objects for delete to authenticated
using (
  bucket_id = 'team-spotlight'
  and coalesce((select auth.jwt())->'app_metadata'->>'docutool_role', '') = 'admin'
);
