create table if not exists skimaru_private.player_device_credentials(
 player_no text not null references public.skimaru_players(player_no) on delete cascade,
 token_hash text not null check(token_hash ~ '^[a-f0-9]{64}$'),
 primary_hash text not null,
 created_at timestamptz not null default now(),
 primary key(player_no,token_hash)
);
alter table skimaru_private.player_device_credentials enable row level security;
revoke all on skimaru_private.player_device_credentials from public,anon,authenticated;
create or replace function skimaru_private.player_token_matches(p_no text,p_token text)
returns boolean language sql security definer set search_path='' as $$
 select p_token ~ '^[a-f0-9]{64}$' and exists(
 select 1 from public.skimaru_players p where p.player_no=p_no and p.revoked_at is null
 and (p.token_hash=encode(extensions.digest(p_token,'sha256'),'hex') or exists(
 select 1 from skimaru_private.player_device_credentials d where d.player_no=p.player_no
 and d.primary_hash=p.token_hash and d.token_hash=encode(extensions.digest(p_token,'sha256'),'hex'))));
$$;
revoke all on function skimaru_private.player_token_matches(text,text) from public,anon,authenticated;
create or replace function skimaru_private.reconnect_player(p_player_no text,p_token text,p_recovery text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare p public.skimaru_players;h text;
begin
 if p_player_no is null or p_player_no !~ '^[A-Z0-9-]{4,16}$'
 or p_token is null or p_token !~ '^[a-f0-9]{64}$'
 or p_recovery is null or p_recovery !~ '^[a-f0-9]{32}$' then return jsonb_build_object('error','reconnect_failed');end if;
 if not skimaru_private.rate_ok('reconnect:'||p_player_no,5,900)
 or not skimaru_private.rate_ok('reconnect:global',100,60) then return jsonb_build_object('error','rate_limited');end if;
 perform pg_advisory_xact_lock(hashtextextended(p_player_no,130));
 select * into p from public.skimaru_players where player_no=p_player_no and revoked_at is null;
 if p.player_no is null then return jsonb_build_object('error','reconnect_failed');end if;
 if not (exists(select 1 from skimaru_private.progress_recovery_keys k where k.player_no=p_player_no
 and k.recovery_hash=encode(extensions.digest(p_recovery,'sha256'),'hex'))
 or exists(select 1 from skimaru_private.player_backups b where b.player_no=p_player_no
 and b.recovery_hash=encode(extensions.digest(p_recovery,'sha256'),'hex'))) then
 return jsonb_build_object('error','reconnect_failed');end if;
 h:=encode(extensions.digest(p_token,'sha256'),'hex');
 if not skimaru_private.player_token_matches(p_player_no,p_token) then
  if (select count(*) from skimaru_private.player_device_credentials d where d.player_no=p_player_no and d.primary_hash=p.token_hash)>=8 then return jsonb_build_object('error','device_limit');end if;
  insert into skimaru_private.player_device_credentials(player_no,token_hash,primary_hash) values(p_player_no,h,p.token_hash)
  on conflict(player_no,token_hash) do update set primary_hash=excluded.primary_hash,created_at=now();
  insert into skimaru_private.security_audit(action,target) values('player_connection_repaired',p_player_no);
 end if;
 return jsonb_build_object('state','active','playerNo',p.player_no,'name',p.user_name,'site',p.site);
end;$$;
revoke all on function skimaru_private.reconnect_player(text,text,text) from public,anon,authenticated;
create or replace function public.skimaru_reconnect_player(p_player_no text,p_token text,p_recovery text)
returns jsonb language sql security invoker set search_path='' as $$select skimaru_private.reconnect_player(p_player_no,p_token,p_recovery);$$;
revoke all on function public.skimaru_reconnect_player(text,text,text) from public;
grant execute on function public.skimaru_reconnect_player(text,text,text) to anon,authenticated;
grant execute on function skimaru_private.reconnect_player(text,text,text) to anon,authenticated;

CREATE OR REPLACE FUNCTION skimaru_private.player_enrollment(p_player_no text, p_token text, p_kind text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_year integer:=extract(year from now() at time zone 'Asia/Tokyo'); v_kind text; v_updated timestamptz;
begin
 perform skimaru_private.player_verified(p_player_no,p_token);
 if p_kind is not null then
  if p_kind not in ('grade1','grade2','none','manager') then raise exception 'invalid_enrollment'; end if;
  insert into skimaru_private.player_enrollments(player_no,exam_year,kind)
  values(p_player_no,v_year,p_kind)
  on conflict(player_no,exam_year) do update set kind=excluded.kind,updated_at=now();
 end if;
 select kind,updated_at into v_kind,v_updated from skimaru_private.player_enrollments
 where player_no=p_player_no and exam_year=v_year;
 return jsonb_build_object('year',v_year,'kind',v_kind,'updatedAt',v_updated);
end;$function$;

CREATE OR REPLACE FUNCTION skimaru_private.player_status(p_player_no text, p_token text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare p public.skimaru_players;
begin
 select * into p from public.skimaru_players where player_no=p_player_no;
 if not found then return jsonb_build_object('state','missing'); end if;
 if p.revoked_at is not null then return jsonb_build_object('state','revoked'); end if;
 if p_token is null or not coalesce(skimaru_private.player_token_matches(p_player_no,p_token),false) then return jsonb_build_object('state','invalid'); end if;
 return jsonb_build_object('state','active','name',p.user_name,'site',p.site);
end;$function$;

CREATE OR REPLACE FUNCTION skimaru_private.player_verified(p_no text, p_token text)
 RETURNS skimaru_players
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare p public.skimaru_players;begin
 perform pg_advisory_xact_lock(hashtextextended(coalesce(p_no,''),130));
 select * into p from public.skimaru_players where player_no=p_no and revoked_at is null;
 if p.player_no is null or p_token is null or p_token!~'^[a-f0-9]{64}$' or not coalesce(skimaru_private.player_token_matches(p_no,p_token),false) then raise exception 'player_authentication_required';end if;
 return p;end;$function$;

CREATE OR REPLACE FUNCTION skimaru_private.register_player(p_player_no text, p_name text, p_site text, p_token text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare p public.skimaru_players; h text;
begin
 if p_player_no is null or p_player_no !~ '^[A-Z0-9-]{4,16}$' or char_length(btrim(p_name)) not between 1 and 20 or p_name is null or p_site is null or p_site not in ('四日市','石岡','足利','水戸','真岡','門真','北九州') or p_token is null or p_token !~ '^[a-f0-9]{64}$' then raise exception 'invalid_registration'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_player_no,130));
 h:=encode(extensions.digest(p_token,'sha256'),'hex');
 select * into p from public.skimaru_players where player_no=p_player_no;
 if found then
  if p.revoked_at is not null then raise exception 'registration_revoked'; end if;
  if not coalesce(skimaru_private.player_token_matches(p_player_no,p_token),false) then raise exception 'registration_token_mismatch'; end if;
  update public.skimaru_players set user_name=btrim(p_name),site=p_site,updated_at=now() where player_no=p_player_no;
 else
 if not skimaru_private.rate_ok('registration:global',500,3600) then return jsonb_build_object('error','rate_limited');end if;
 insert into public.skimaru_players(player_no,user_name,site,token_hash) values(p_player_no,btrim(p_name),p_site,h); end if;
 return jsonb_build_object('state','active','playerNo',p_player_no,'name',btrim(p_name),'site',p_site);
end;$function$;

