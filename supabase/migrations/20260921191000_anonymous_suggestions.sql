-- Global anonymous suggestion board.
-- Suggestions are public immediately, contain no author identity, and can be moderated by DocuTool admins.

create table if not exists public.anonymous_suggestions (
  id uuid primary key default gen_random_uuid(),
  message text not null check (char_length(message) between 2 and 500),
  is_visible boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists anonymous_suggestions_visible_created_idx
  on public.anonymous_suggestions (is_visible, created_at desc);

alter table public.anonymous_suggestions enable row level security;

grant select, insert on public.anonymous_suggestions to anon, authenticated;
grant update, delete on public.anonymous_suggestions to authenticated;

drop policy if exists "visible anonymous suggestions are public" on public.anonymous_suggestions;
create policy "visible anonymous suggestions are public"
on public.anonymous_suggestions for select
to anon, authenticated
using (is_visible);

drop policy if exists "anyone can submit anonymous suggestions" on public.anonymous_suggestions;
create policy "anyone can submit anonymous suggestions"
on public.anonymous_suggestions for insert
to anon, authenticated
with check (
  is_visible = true
  and char_length(message) between 2 and 500
);

drop policy if exists "admins can read all anonymous suggestions" on public.anonymous_suggestions;
create policy "admins can read all anonymous suggestions"
on public.anonymous_suggestions for select
to authenticated
using (coalesce((select auth.jwt())->'app_metadata'->>'docutool_role', '') = 'admin');

drop policy if exists "admins can update anonymous suggestions" on public.anonymous_suggestions;
create policy "admins can update anonymous suggestions"
on public.anonymous_suggestions for update
to authenticated
using (coalesce((select auth.jwt())->'app_metadata'->>'docutool_role', '') = 'admin')
with check (coalesce((select auth.jwt())->'app_metadata'->>'docutool_role', '') = 'admin');

drop policy if exists "admins can delete anonymous suggestions" on public.anonymous_suggestions;
create policy "admins can delete anonymous suggestions"
on public.anonymous_suggestions for delete
to authenticated
using (coalesce((select auth.jwt())->'app_metadata'->>'docutool_role', '') = 'admin');
