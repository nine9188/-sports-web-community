-- Account-scoped post drafts with a 3-day retention window.
-- Run this in the Supabase SQL editor.

create table if not exists public.post_drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  board_id uuid not null references public.boards(id) on delete cascade,
  title text not null default '',
  content jsonb not null,
  deal_info jsonb,
  poll jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '3 days')
);

create index if not exists post_drafts_user_updated_idx
  on public.post_drafts (user_id, updated_at desc);

create index if not exists post_drafts_user_board_updated_idx
  on public.post_drafts (user_id, board_id, updated_at desc);

create index if not exists post_drafts_expires_at_idx
  on public.post_drafts (expires_at);

alter table public.post_drafts enable row level security;

drop policy if exists "Users can view own post drafts" on public.post_drafts;
create policy "Users can view own post drafts"
  on public.post_drafts
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own post drafts" on public.post_drafts;
create policy "Users can insert own post drafts"
  on public.post_drafts
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own post drafts" on public.post_drafts;
create policy "Users can update own post drafts"
  on public.post_drafts
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own post drafts" on public.post_drafts;
create policy "Users can delete own post drafts"
  on public.post_drafts
  for delete
  using (auth.uid() = user_id);

create or replace function public.set_post_drafts_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  new.expires_at = now() + interval '3 days';
  return new;
end;
$$;

drop trigger if exists set_post_drafts_updated_at on public.post_drafts;
create trigger set_post_drafts_updated_at
  before update on public.post_drafts
  for each row
  execute function public.set_post_drafts_updated_at();

create or replace function public.delete_expired_post_drafts()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_count integer;
begin
  delete from public.post_drafts
  where expires_at < now();

  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

revoke execute on function public.delete_expired_post_drafts() from anon, authenticated;
revoke execute on function public.delete_expired_post_drafts() from public;

-- Optional automatic cleanup. If pg_cron is not enabled on the project,
-- run the table/RLS section above first and configure a daily external cron
-- to execute: select public.delete_expired_post_drafts();
create extension if not exists pg_cron with schema extensions;

select cron.unschedule('delete-expired-post-drafts')
where exists (
  select 1 from cron.job where jobname = 'delete-expired-post-drafts'
);

select cron.schedule(
  'delete-expired-post-drafts',
  '20 3 * * *',
  $$select public.delete_expired_post_drafts();$$
);
