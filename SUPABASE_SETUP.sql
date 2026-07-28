-- スキマル保全士 Ver 4.9.0 / Supabase 初期設定
-- Supabase Dashboard > SQL Editor で全体を実行してください。

alter table public.exam_results
  add column if not exists submission_id text,
  add column if not exists correct_count integer default 0,
  add column if not exists submitted_at timestamptz,
  add column if not exists streak integer default 0,
  add column if not exists mastered_count integer default 0,
  add column if not exists wrong_count integer default 0,
  add column if not exists category_results jsonb default '{}'::jsonb,
  add column if not exists weak_questions jsonb default '[]'::jsonb,
  add column if not exists raw_result jsonb default '{}'::jsonb;

-- 既存列が未作成の場合に備えて追加
alter table public.exam_results
  add column if not exists user_name text,
  add column if not exists location text,
  add column if not exists score integer default 0,
  add column if not exists total_questions integer default 0,
  add column if not exists correct_rate integer default 0,
  add column if not exists elapsed_seconds integer default 0,
  add column if not exists exam_version text;

create unique index if not exists exam_results_submission_id_uq
  on public.exam_results (submission_id);

alter table public.exam_results enable row level security;

-- プレイヤー（未ログイン）は新規提出だけ可能
grant insert on table public.exam_results to anon;
drop policy if exists "players_can_submit_results" on public.exam_results;
create policy "players_can_submit_results"
  on public.exam_results
  for insert
  to anon
  with check (true);

-- ログイン済み管理者は閲覧と削除が可能
grant select, delete on table public.exam_results to authenticated;
drop policy if exists "managers_can_read_results" on public.exam_results;
create policy "managers_can_read_results"
  on public.exam_results
  for select
  to authenticated
  using (true);

drop policy if exists "managers_can_delete_results" on public.exam_results;
create policy "managers_can_delete_results"
  on public.exam_results
  for delete
  to authenticated
  using (true);

-- idがserial/identityの場合の採番権限
grant usage, select on all sequences in schema public to anon, authenticated;
