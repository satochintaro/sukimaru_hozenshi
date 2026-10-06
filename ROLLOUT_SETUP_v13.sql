-- スキマル保全士: 登録管理・対象者削除。既存の成績は変更しません。
create schema if not exists skimaru_private;
revoke all on schema skimaru_private from public;
grant usage on schema skimaru_private to anon, authenticated;
create table if not exists public.skimaru_players (
 player_no text primary key,
 user_name text,
 site text,
 token_hash text,
 registered_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 revoked_at timestamptz,
 constraint skimaru_players_active_fields check (revoked_at is not null or (char_length(btrim(user_name)) between 1 and 20 and site in ('四日市','石岡','足利','水戸','真岡','門真','北九州') and token_hash is not null))
);
alter table public.skimaru_players enable row level security;
revoke all on public.skimaru_players from anon, authenticated;
-- Browser access is only through bounded RPCs; the token hash is never returned.
create or replace function skimaru_private.register_player(p_player_no text,p_name text,p_site text,p_token text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare p public.skimaru_players; h text;
begin
 if p_player_no !~ '^[A-Z0-9-]{4,16}$' or char_length(btrim(p_name)) not between 1 and 20 or p_name is null or p_site is null or p_site not in ('四日市','石岡','足利','水戸','真岡','門真','北九州') or p_token is null or p_token !~ '^[a-f0-9]{64}$' then raise exception 'invalid_registration'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_player_no,130));
 h:=encode(extensions.digest(p_token,'sha256'),'hex');
 select * into p from public.skimaru_players where player_no=p_player_no;
 if found then
  if p.revoked_at is not null then raise exception 'registration_revoked'; end if;
  if p.token_hash<>h then raise exception 'registration_token_mismatch'; end if;
  update public.skimaru_players set user_name=btrim(p_name),site=p_site,updated_at=now() where player_no=p_player_no;
 else insert into public.skimaru_players(player_no,user_name,site,token_hash) values(p_player_no,btrim(p_name),p_site,h); end if;
 return jsonb_build_object('state','active','playerNo',p_player_no,'name',btrim(p_name),'site',p_site);
end;$$;
create or replace function public.skimaru_register_player(p_player_no text,p_name text,p_site text,p_token text)
returns jsonb language sql security invoker set search_path='' as $$select skimaru_private.register_player(p_player_no,p_name,p_site,p_token);$$;
create or replace function skimaru_private.player_status(p_player_no text,p_token text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare p public.skimaru_players;
begin
 select * into p from public.skimaru_players where player_no=p_player_no;
 if not found then return jsonb_build_object('state','missing'); end if;
 if p.revoked_at is not null then return jsonb_build_object('state','revoked'); end if;
 if p_token is null or p.token_hash<>encode(extensions.digest(p_token,'sha256'),'hex') then return jsonb_build_object('state','invalid'); end if;
 return jsonb_build_object('state','active','name',p.user_name,'site',p.site);
end;$$;
create or replace function public.skimaru_player_status(p_player_no text,p_token text)
returns jsonb language sql security invoker set search_path='' as $$select skimaru_private.player_status(p_player_no,p_token);$$;
create or replace function skimaru_private.developer_players()
returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb;
begin
 if auth.uid() is distinct from 'abbbba99-017d-4016-bdec-6543712a16d7'::uuid then raise exception 'developer_required'; end if;
 with submitted as (
 select coalesce(nullif(player_no,''),'LEGACY:'||coalesce(raw_result->>'site','四日市')||':'||coalesce(user_name,'(未記入)')) as key,
 max(nullif(player_no,'')) as player_no,(array_agg(coalesce(user_name,'(未記入)') order by created_at desc,id desc))[1] as name,
 (array_agg(coalesce(raw_result->>'site','四日市') order by created_at desc,id desc))[1] as site,count(*) as n,max(created_at) as last_at
 from public.exam_results group by 1
 ), persons as (
 select coalesce(p.player_no,s.key) as key,coalesce(p.player_no,s.player_no) as player_no,coalesce(p.user_name,s.name) as name,coalesce(p.site,s.site) as site,p.registered_at,coalesce(s.n,0) as n,s.last_at,p.player_no is not null as registered
 from public.skimaru_players p full join submitted s on s.key=p.player_no where p.revoked_at is null
 ) select coalesce(jsonb_agg(jsonb_build_object('key',key,'playerNo',player_no,'name',name,'site',site,'registeredAt',registered_at,'submissionCount',n,'lastSubmittedAt',last_at,'registered',registered) order by site,name,key),'[]'::jsonb) into result from persons;
 return result;
end;$$;
create or replace function public.skimaru_developer_players()
returns jsonb language sql security invoker set search_path='' as $$select skimaru_private.developer_players();$$;
create or replace function skimaru_private.delete_player(p_player_key text,p_expected_count integer,p_confirm_name text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare n integer; actual_name text; registry_exists boolean; deleted_messages integer:=0;
begin
 if auth.uid() is distinct from 'abbbba99-017d-4016-bdec-6543712a16d7'::uuid then raise exception 'developer_required'; end if;
 if p_player_key is null or p_expected_count is null or p_expected_count<0 or p_confirm_name is null then raise exception 'invalid_target'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_player_key,130));
 select user_name into actual_name from public.skimaru_players where player_no=p_player_key and revoked_at is null;
 registry_exists:=found;
 if not registry_exists then
 select user_name into actual_name from public.exam_results where coalesce(nullif(player_no,''),'LEGACY:'||coalesce(raw_result->>'site','四日市')||':'||coalesce(user_name,'(未記入)'))=p_player_key order by created_at desc,id desc limit 1;
 if not found then raise exception 'target_not_found'; end if; end if;
 if coalesce(actual_name,'(未記入)')<>p_confirm_name then raise exception 'name_confirmation_mismatch'; end if;
 select count(*) into n from public.exam_results where coalesce(nullif(player_no,''),'LEGACY:'||coalesce(raw_result->>'site','四日市')||':'||coalesce(user_name,'(未記入)'))=p_player_key;
 if n<>p_expected_count then raise exception 'submissions_changed_refresh'; end if;
 if p_player_key not like 'LEGACY:%' then
  insert into public.skimaru_players(player_no,revoked_at) values(p_player_key,now()) on conflict(player_no) do update set user_name=null,site=null,token_hash=null,revoked_at=now(),updated_at=now();
  delete from public.player_messages where player_no=p_player_key;get diagnostics deleted_messages=row_count;
 end if;
 delete from public.exam_results where coalesce(nullif(player_no,''),'LEGACY:'||coalesce(raw_result->>'site','四日市')||':'||coalesce(user_name,'(未記入)'))=p_player_key;
 return jsonb_build_object('deletedSubmissions',n,'deletedMessages',deleted_messages,'registrationDeleted',true);
end;$$;
create or replace function public.skimaru_delete_player(p_player_key text,p_expected_count integer,p_confirm_name text)
returns jsonb language sql security invoker set search_path='' as $$select skimaru_private.delete_player(p_player_key,p_expected_count,p_confirm_name);$$;
-- Block re-submission by a removed player, including from older app versions.
create or replace function skimaru_private.check_player_submission()
returns trigger language plpgsql security definer set search_path='' as $$
declare p public.skimaru_players;
begin
 if new.player_no is not null then
 perform pg_advisory_xact_lock(hashtextextended(new.player_no,130));
 select * into p from public.skimaru_players where player_no=new.player_no;
 if found and p.revoked_at is not null then raise exception 'registration_revoked'; end if;
 if new.exam_version='13.0' and (p.player_no is null or p.revoked_at is not null) then raise exception 'registration_required'; end if;
 elsif new.exam_version='13.0' then raise exception 'registration_required'; end if;
 return new;
end;$$;
drop trigger if exists skimaru_check_player_submission on public.exam_results;
create trigger skimaru_check_player_submission before insert on public.exam_results for each row execute function skimaru_private.check_player_submission();
revoke all on function skimaru_private.register_player(text,text,text,text), skimaru_private.player_status(text,text), skimaru_private.developer_players(), skimaru_private.delete_player(text,integer,text), skimaru_private.check_player_submission() from public;
revoke all on function public.skimaru_register_player(text,text,text,text), public.skimaru_player_status(text,text), public.skimaru_developer_players(), public.skimaru_delete_player(text,integer,text) from public;
grant execute on function skimaru_private.register_player(text,text,text,text),skimaru_private.player_status(text,text),public.skimaru_register_player(text,text,text,text),public.skimaru_player_status(text,text) to anon,authenticated;
grant execute on function skimaru_private.developer_players(),skimaru_private.delete_player(text,integer,text),public.skimaru_developer_players(),public.skimaru_delete_player(text,integer,text) to authenticated;
-- Keep existing clients working; only the authenticated developer can delete.
alter policy managers_can_delete_results on public.exam_results using ((select auth.uid())='abbbba99-017d-4016-bdec-6543712a16d7'::uuid);
alter policy player_messages_manager_delete on public.player_messages using ((select auth.uid())='abbbba99-017d-4016-bdec-6543712a16d7'::uuid);
