-- Global photo roulettes for Kudos and Sharecare Family Moments.
-- Reuses the existing public `recognition-images` bucket so no additional bucket is required.

create table if not exists public.photo_gallery_items (
  id uuid primary key default gen_random_uuid(),
  gallery text not null check (gallery in ('kudos', 'sharecare_family_moments')),
  title text check (title is null or char_length(title) <= 160),
  caption text check (caption is null or char_length(caption) <= 600),
  image_path text not null check (char_length(image_path) between 1 and 1024),
  is_published boolean not null default true,
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists photo_gallery_items_gallery_sort_idx
  on public.photo_gallery_items (gallery, is_published, sort_order, created_at desc);

alter table public.photo_gallery_items enable row level security;

grant select on public.photo_gallery_items to anon, authenticated;
grant insert, update, delete on public.photo_gallery_items to authenticated;

drop policy if exists "published photo gallery items are public" on public.photo_gallery_items;
create policy "published photo gallery items are public"
on public.photo_gallery_items for select
to anon, authenticated
using (is_published);

drop policy if exists "admins can read all photo gallery items" on public.photo_gallery_items;
create policy "admins can read all photo gallery items"
on public.photo_gallery_items for select
to authenticated
using (coalesce((select auth.jwt())->'app_metadata'->>'docutool_role', '') = 'admin');

drop policy if exists "admins can insert photo gallery items" on public.photo_gallery_items;
create policy "admins can insert photo gallery items"
on public.photo_gallery_items for insert
to authenticated
with check (coalesce((select auth.jwt())->'app_metadata'->>'docutool_role', '') = 'admin');

drop policy if exists "admins can update photo gallery items" on public.photo_gallery_items;
create policy "admins can update photo gallery items"
on public.photo_gallery_items for update
to authenticated
using (coalesce((select auth.jwt())->'app_metadata'->>'docutool_role', '') = 'admin')
with check (coalesce((select auth.jwt())->'app_metadata'->>'docutool_role', '') = 'admin');

drop policy if exists "admins can delete photo gallery items" on public.photo_gallery_items;
create policy "admins can delete photo gallery items"
on public.photo_gallery_items for delete
to authenticated
using (coalesce((select auth.jwt())->'app_metadata'->>'docutool_role', '') = 'admin');

-- Keep updated_at current without adding a dependency on the private trigger helper.
create or replace function public.set_photo_gallery_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists photo_gallery_items_set_updated_at on public.photo_gallery_items;
create trigger photo_gallery_items_set_updated_at
before update on public.photo_gallery_items
for each row execute function public.set_photo_gallery_updated_at();
