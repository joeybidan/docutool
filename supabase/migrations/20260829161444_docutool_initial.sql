-- DocuTool shared content, recognition storage, and idempotent visitor sessions.
-- Personal note templates and note drafts intentionally remain browser-local.

create schema if not exists private;
revoke all on schema private from public;

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 160),
  message text not null check (char_length(message) between 1 and 4000),
  is_published boolean not null default true,
  sort_order integer not null default 0 check (sort_order >= 0),
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.shared_links (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 160),
  description text check (description is null or char_length(description) <= 600),
  url text not null check (url ~* '^https?://'),
  is_published boolean not null default true,
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.top_performers (
  id uuid primary key default gen_random_uuid(),
  employee_name text not null check (char_length(employee_name) between 1 and 160),
  category text not null check (category in ('Top Agent', 'Top CSAT', 'Top QA')),
  caption text check (caption is null or char_length(caption) <= 600),
  image_path text not null check (char_length(image_path) between 1 and 1024),
  is_published boolean not null default true,
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.site_metrics (
  metric_key text primary key,
  metric_value bigint not null default 0 check (metric_value >= 0),
  updated_at timestamptz not null default now()
);

create table public.site_visits (
  session_id uuid primary key,
  first_seen_at timestamptz not null default now()
);

comment on table public.site_visits is
  'One row per browser-tab session. Session IDs exist only to make visit recording idempotent.';

create index announcements_published_sort_idx
  on public.announcements (is_published, sort_order, published_at desc);
create index shared_links_published_sort_idx
  on public.shared_links (is_published, sort_order);
create index top_performers_published_sort_idx
  on public.top_performers (is_published, sort_order);

create or replace function private.set_updated_at()
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

create trigger announcements_set_updated_at
before update on public.announcements
for each row execute function private.set_updated_at();

create trigger shared_links_set_updated_at
before update on public.shared_links
for each row execute function private.set_updated_at();

create trigger top_performers_set_updated_at
before update on public.top_performers
for each row execute function private.set_updated_at();

insert into public.site_metrics (metric_key, metric_value)
values ('browser_sessions', 0)
on conflict (metric_key) do nothing;

insert into public.announcements
  (id, title, message, is_published, sort_order, published_at)
values
  (
    '00000000-0000-4000-8000-000000000001',
    'Start with the member''s goal',
    'Confirm the reason for the call before documenting the resolution.',
    true,
    0,
    now()
  ),
  (
    '00000000-0000-4000-8000-000000000002',
    'Protect customer information',
    'Review your note before copying it into any approved system of record.',
    true,
    1,
    now() - interval '1 day'
  )
on conflict (id) do nothing;

insert into public.shared_links
  (id, title, description, url, is_published, sort_order)
values
  (
    '00000000-0000-4000-8000-000000000101',
    'Microsoft 365 training',
    'Self-guided productivity training and reference material.',
    'https://support.microsoft.com/training',
    true,
    0
  ),
  (
    '00000000-0000-4000-8000-000000000102',
    'SharePoint help',
    'Guidance for files, lists, sites, and team resources.',
    'https://support.microsoft.com/sharepoint',
    true,
    1
  )
on conflict (id) do nothing;

alter table public.announcements enable row level security;
alter table public.shared_links enable row level security;
alter table public.top_performers enable row level security;
alter table public.site_metrics enable row level security;
alter table public.site_visits enable row level security;

-- Explicit grants are required because new tables are not auto-exposed to the Data API.
grant select on public.announcements, public.shared_links, public.top_performers
  to anon, authenticated;
grant insert, update, delete on public.announcements, public.shared_links, public.top_performers
  to authenticated;
grant select on public.site_metrics to anon, authenticated;
revoke all on public.site_visits from anon, authenticated;

create policy "published announcements are public"
on public.announcements for select
to anon, authenticated
using (is_published);

create policy "admins can read all announcements"
on public.announcements for select
to authenticated
using (coalesce((select auth.jwt())->'app_metadata'->>'docutool_role', '') = 'admin');

create policy "admins can insert announcements"
on public.announcements for insert
to authenticated
with check (coalesce((select auth.jwt())->'app_metadata'->>'docutool_role', '') = 'admin');

create policy "admins can update announcements"
on public.announcements for update
to authenticated
using (coalesce((select auth.jwt())->'app_metadata'->>'docutool_role', '') = 'admin')
with check (coalesce((select auth.jwt())->'app_metadata'->>'docutool_role', '') = 'admin');

create policy "admins can delete announcements"
on public.announcements for delete
to authenticated
using (coalesce((select auth.jwt())->'app_metadata'->>'docutool_role', '') = 'admin');

create policy "published links are public"
on public.shared_links for select
to anon, authenticated
using (is_published);

create policy "admins can read all links"
on public.shared_links for select
to authenticated
using (coalesce((select auth.jwt())->'app_metadata'->>'docutool_role', '') = 'admin');

create policy "admins can insert links"
on public.shared_links for insert
to authenticated
with check (coalesce((select auth.jwt())->'app_metadata'->>'docutool_role', '') = 'admin');

create policy "admins can update links"
on public.shared_links for update
to authenticated
using (coalesce((select auth.jwt())->'app_metadata'->>'docutool_role', '') = 'admin')
with check (coalesce((select auth.jwt())->'app_metadata'->>'docutool_role', '') = 'admin');

create policy "admins can delete links"
on public.shared_links for delete
to authenticated
using (coalesce((select auth.jwt())->'app_metadata'->>'docutool_role', '') = 'admin');

create policy "published recognition is public"
on public.top_performers for select
to anon, authenticated
using (is_published);

create policy "admins can read all recognition"
on public.top_performers for select
to authenticated
using (coalesce((select auth.jwt())->'app_metadata'->>'docutool_role', '') = 'admin');

create policy "admins can insert recognition"
on public.top_performers for insert
to authenticated
with check (coalesce((select auth.jwt())->'app_metadata'->>'docutool_role', '') = 'admin');

create policy "admins can update recognition"
on public.top_performers for update
to authenticated
using (coalesce((select auth.jwt())->'app_metadata'->>'docutool_role', '') = 'admin')
with check (coalesce((select auth.jwt())->'app_metadata'->>'docutool_role', '') = 'admin');

create policy "admins can delete recognition"
on public.top_performers for delete
to authenticated
using (coalesce((select auth.jwt())->'app_metadata'->>'docutool_role', '') = 'admin');

create policy "browser session metric is public"
on public.site_metrics for select
to anon, authenticated
using (metric_key = 'browser_sessions');

-- The bucket is public for published recognition portraits. All mutations still require an
-- authenticated admin through storage.objects policies.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'recognition-images',
  'recognition-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "recognition images are public"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'recognition-images');

create policy "admins can upload recognition images"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'recognition-images'
  and coalesce((select auth.jwt())->'app_metadata'->>'docutool_role', '') = 'admin'
);

create policy "admins can update recognition images"
on storage.objects for update
to authenticated
using (
  bucket_id = 'recognition-images'
  and coalesce((select auth.jwt())->'app_metadata'->>'docutool_role', '') = 'admin'
)
with check (
  bucket_id = 'recognition-images'
  and coalesce((select auth.jwt())->'app_metadata'->>'docutool_role', '') = 'admin'
);

create policy "admins can delete recognition images"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'recognition-images'
  and coalesce((select auth.jwt())->'app_metadata'->>'docutool_role', '') = 'admin'
);

create or replace function public.record_docutool_visit(p_session_id uuid)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  inserted_count integer;
  current_count bigint;
begin
  if p_session_id is null then
    raise exception 'session id is required';
  end if;

  insert into public.site_visits (session_id)
  values (p_session_id)
  on conflict (session_id) do nothing;

  get diagnostics inserted_count = row_count;

  if inserted_count = 1 then
    update public.site_metrics
    set metric_value = metric_value + 1,
        updated_at = now()
    where metric_key = 'browser_sessions'
    returning metric_value into current_count;
  else
    select metric_value
    into current_count
    from public.site_metrics
    where metric_key = 'browser_sessions';
  end if;

  return coalesce(current_count, 0);
end;
$$;

comment on function public.record_docutool_visit(uuid) is
  'Intentional public RPC: inserts only a UUID, deduplicates by primary key, and returns one aggregate counter.';

revoke execute on function public.record_docutool_visit(uuid) from public, anon, authenticated;
grant execute on function public.record_docutool_visit(uuid) to anon, authenticated;
