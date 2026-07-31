-- スキマル保全士 Ver 5.0 更新SQL
-- Supabase Dashboard > SQL Editor で実行してください。

alter table public.exam_results
  add column if not exists player_no text;

create index if not exists exam_results_player_no_created_at_idx
  on public.exam_results (player_no, created_at desc);
