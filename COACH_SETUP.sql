-- スキマル保全士 Ver 5.4.0 学習コーチ用
-- Supabase SQL Editor で1回実行してください。

create table if not exists public.coach_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.player_messages (
  id uuid primary key default gen_random_uuid(),
  player_no text not null,
  message text not null check (char_length(message) between 1 and 500),
  created_at timestamptz not null default now(),
  expires_at timestamptz null
);

alter table public.coach_settings enable row level security;
alter table public.player_messages enable row level security;

drop policy if exists "coach_settings_public_read" on public.coach_settings;
create policy "coach_settings_public_read"
on public.coach_settings for select
to anon, authenticated
using (true);

drop policy if exists "coach_settings_manager_write" on public.coach_settings;
create policy "coach_settings_manager_write"
on public.coach_settings for all
to authenticated
using (true)
with check (true);

drop policy if exists "player_messages_public_read" on public.player_messages;
create policy "player_messages_public_read"
on public.player_messages for select
to anon, authenticated
using (true);

drop policy if exists "player_messages_manager_write" on public.player_messages;
create policy "player_messages_manager_write"
on public.player_messages for insert
to authenticated
with check (true);

drop policy if exists "player_messages_manager_delete" on public.player_messages;
create policy "player_messages_manager_delete"
on public.player_messages for delete
to authenticated
using (true);

create index if not exists player_messages_player_no_created_at_idx
on public.player_messages (player_no, created_at desc);
