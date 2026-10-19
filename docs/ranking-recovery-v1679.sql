CREATE OR REPLACE FUNCTION skimaru_private.challenge_leaderboard(p_player_no text, p_token text, p_grade integer, p_scope text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
 SET statement_timeout TO '5s'
AS $function$
declare viewer jsonb;v_key text;v_site text;result jsonb;
begin
 if p_grade is null or p_grade not in (1,2) or p_scope is null or p_scope not in ('all','site') then raise exception 'invalid_request';end if;
 if p_player_no is not null and p_token is not null then
  viewer:=skimaru_private.player_status(p_player_no,p_token);
  -- Recovery proof is accepted only by this read-only leaderboard endpoint.
  -- It never rotates login tokens or restores/writes learning records.
  if viewer->>'state' is distinct from 'active' and p_token ~ '^recovery:[a-f0-9]{32}$' then
   if not skimaru_private.rate_ok('ranking-recovery:'||left(p_player_no,32),10,60) then raise exception 'rate_limited';end if;
   select jsonb_build_object('state','active','site',p.site) into viewer
   from public.skimaru_players p where p.player_no=p_player_no and p.revoked_at is null
   and (exists(select 1 from skimaru_private.progress_recovery_keys k where k.player_no=p.player_no and k.recovery_hash=encode(extensions.digest(substring(p_token from 10),'sha256'),'hex'))
     or exists(select 1 from skimaru_private.player_backups b where b.player_no=p.player_no and b.recovery_hash=encode(extensions.digest(substring(p_token from 10),'sha256'),'hex')));
  end if;
  if viewer->>'state' is distinct from 'active' then raise exception 'player_authentication_required';end if;
  v_site:=viewer->>'site';
 else
  perform skimaru_private.follow_developer_guard();
  if p_scope='site' then raise exception 'player_authentication_required';end if;
 end if;
 v_key:=case when p_grade=1 then 'skimaru-grade1-v16' else 'skimaruData' end;
 with scores as materialized (
  select p.player_no,coalesce(i.nickname,'プレイヤー-'||right(p.player_no,4)) as name,p.site,b.best,b.saved_at
  from public.skimaru_players p left join skimaru_private.player_identities i on i.player_no=p.player_no
  cross join lateral (
   select max(x.best) as best,max(x.saved_at) as saved_at from (
    select skimaru_private.challenge_best(h.payload,v_key) as best,h.saved_at from skimaru_private.progress_heads h where h.player_no=p.player_no
    union all
    select skimaru_private.challenge_best(o.payload,v_key),o.saved_at from skimaru_private.player_backups o where o.player_no=p.player_no
   ) x
  ) b where p.revoked_at is null and b.best>0 and (p_scope='all' or p.site=v_site)
 ), ranked as materialized (
  select player_no,name,site,best,saved_at,rank() over(order by best desc) as position from scores
 ), limited as (select * from ranked order by best desc,site,name,player_no limit 100)
 select jsonb_build_object('grade',p_grade,'scope',p_scope,'total',(select count(*) from ranked),'generatedAt',now(),
  'rows',coalesce((select jsonb_agg(jsonb_build_object('rank',position,'name',name,'site',site,'best',best,'isSelf',coalesce(player_no=p_player_no,false)) order by best desc,site,name,player_no) from limited),'[]'::jsonb),
  'mine',(select jsonb_build_object('rank',position,'name',name,'site',site,'best',best,'isSelf',true) from ranked where player_no=p_player_no limit 1)) into result;
 return result;
end;$function$
