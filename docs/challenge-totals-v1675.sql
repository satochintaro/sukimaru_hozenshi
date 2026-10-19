-- Read-time normalization only. Stored answers, backups and rankings are unchanged.
CREATE OR REPLACE FUNCTION skimaru_private.metric_with_challenge(m jsonb, record jsonb, challenge_seconds numeric DEFAULT 0)
RETURNS jsonb LANGUAGE plpgsql IMMUTABLE SECURITY INVOKER SET search_path = '' AS $function$
DECLARE l jsonb; h jsonb; c jsonb; seen text[] := ARRAY[]::text[];
  sd_total numeric := 0; sd_correct numeric := 0; score numeric;
  base_total numeric; base_correct numeric; base_seconds numeric;
BEGIN
  IF m IS NULL OR m->>'includesChallenge' = 'true' OR record IS NULL THEN RETURN m; END IF;
  l := coalesce(record->'suddenDeath', '{}'::jsonb);
  FOR h IN SELECT value FROM jsonb_array_elements(CASE WHEN jsonb_typeof(l->'history')='array' THEN l->'history' ELSE '[]'::jsonb END) LOOP
    IF coalesce(h->>'id','')='' OR h->>'id'=ANY(seen) THEN CONTINUE; END IF;
    seen:=array_append(seen,h->>'id');
    score:=CASE WHEN coalesce(h->>'score','') ~ '^[0-9]{1,9}$' THEN (h->>'score')::numeric ELSE 0 END;
    sd_correct:=sd_correct+score; sd_total:=sd_total+score+CASE WHEN h->>'reason'='incorrect' THEN 1 ELSE 0 END;
  END LOOP;
  c:=l->'current';
  IF coalesce(c->>'id','')<>'' AND NOT(c->>'id'=ANY(seen)) THEN
    score:=CASE WHEN coalesce(c->>'index','') ~ '^[0-9]{1,9}$' THEN (c->>'index')::numeric ELSE 0 END;
    sd_correct:=sd_correct+score;sd_total:=sd_total+score+CASE WHEN c->>'phase'='failed' THEN 1 ELSE 0 END;
  END IF;
  sd_correct:=least(1000000,greatest(sd_correct,CASE WHEN coalesce(l->>'correctAnswers','') ~ '^[0-9]{1,9}$' THEN (l->>'correctAnswers')::numeric ELSE 0 END));
  sd_total:=least(1000000,greatest(sd_total,sd_correct,CASE WHEN coalesce(l->>'totalAnswers','') ~ '^[0-9]{1,9}$' THEN (l->>'totalAnswers')::numeric ELSE 0 END));
  base_total:=CASE WHEN coalesce(m->>'total','') ~ '^[0-9]{1,9}$' THEN (m->>'total')::numeric ELSE 0 END;
  base_correct:=least(base_total,CASE WHEN coalesce(m->>'correct','') ~ '^[0-9]{1,9}$' THEN (m->>'correct')::numeric ELSE 0 END);
  base_seconds:=CASE WHEN coalesce(m->>'seconds','') ~ '^[0-9]{1,9}(\.[0-9]{1,6})?$' THEN (m->>'seconds')::numeric ELSE 0 END;
  RETURN m || jsonb_build_object('total',base_total+sd_total,'correct',base_correct+sd_correct,
    'seconds',least(31536000,round(base_seconds+greatest(0,coalesce(challenge_seconds,0)))),
    'includesChallenge',true,'challengeTotal',sd_total);
END;
$function$;
REVOKE ALL ON FUNCTION skimaru_private.metric_with_challenge(jsonb,jsonb,numeric) FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION skimaru_private.progress_result_rows(p_history boolean DEFAULT false)
RETURNS SETOF public.exam_results LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $function$
DECLARE r jsonb; rec public.exam_results;
BEGIN
 FOR r IN
 WITH source AS (
   SELECT v.* FROM skimaru_private.progress_versions v JOIN public.skimaru_players p USING(player_no)
   WHERE p.revoked_at IS NULL AND (p_history OR EXISTS(SELECT 1 FROM skimaru_private.progress_heads h WHERE h.version_id=v.id))
 ), expanded AS (
   SELECT s.*, adjusted.m, p.user_name,p.site
   FROM source s JOIN public.skimaru_players p ON p.player_no=s.player_no
   CROSS JOIN LATERAL jsonb_array_elements(s.metrics) original(m)
   LEFT JOIN skimaru_private.progress_heads h ON h.version_id=s.id
   CROSS JOIN LATERAL (SELECT
     (h.payload->'entries'->>CASE WHEN original.m->>'grade'='1' THEN 'skimaru-grade1-v16' ELSE 'skimaruData' END)::jsonb AS record,
     (h.payload->'entries'->>'skimaru-study-time-v12')::jsonb AS clock
   ) backup
   CROSS JOIN LATERAL (SELECT CASE WHEN coalesce(backup.clock->('sudden-death-grade'||(original.m->>'grade'))->>'totalMs','') ~ '^[0-9]{1,14}(\.[0-9]{1,6})?$'
     THEN (backup.clock->('sudden-death-grade'||(original.m->>'grade'))->>'totalMs')::numeric/1000 ELSE 0 END AS seconds) elapsed
   CROSS JOIN LATERAL (SELECT CASE WHEN original.m->>'examType'='academic'
     THEN skimaru_private.metric_with_challenge(original.m,backup.record,elapsed.seconds) ELSE original.m END AS m) top_metric
   CROSS JOIN LATERAL (SELECT CASE WHEN jsonb_typeof(original.m#>'{studyMetricsV12,academic}')='object' AND backup.record IS NOT NULL
     THEN jsonb_set(top_metric.m,'{studyMetricsV12,academic}',skimaru_private.metric_with_challenge(original.m#>'{studyMetricsV12,academic}',backup.record,elapsed.seconds))
     ELSE top_metric.m END AS m) adjusted
   WHERE (adjusted.m->>'total')::numeric>0
 ), chosen AS (
   SELECT DISTINCT ON(player_no,m->>'grade',m->>'examType') * FROM expanded
   ORDER BY player_no,m->>'grade',m->>'examType',captured_at DESC,event_id DESC
 )
 SELECT to_jsonb(x) FROM (SELECT * FROM expanded WHERE p_history UNION ALL SELECT * FROM chosen WHERE NOT p_history) x
 LOOP
  rec:=jsonb_populate_record(null::public.exam_results,jsonb_build_object(
    'id','-9223372036854775808'::bigint+(r->>'event_id')::bigint,
    'submission_id','AUTO:'||(r->>'id')||':'||(r->'m'->>'grade')||':'||(r->'m'->>'examType'),
    'created_at',r->'captured_at','submitted_at',r->'captured_at','player_no',r->'player_no','user_name',r->'user_name','location',r->'site','exam_version','16.75',
    'total_questions',(r->'m'->>'total')::integer,'correct_count',(r->'m'->>'correct')::integer,'score',(r->'m'->>'correct')::integer,
    'correct_rate',round(100.0*(r->'m'->>'correct')::numeric/nullif((r->'m'->>'total')::numeric,0)),
    'elapsed_seconds',coalesce((r->'m'->>'seconds')::integer,0),'category_results',coalesce(r->'m'->'cats','{}'),
    'weak_questions',coalesce(r->'m'->'alerts','[]'),
    'raw_result',(r->'m')||jsonb_build_object('source','auto_sync','autoSynced',true,'playerNo',r->'player_no','name',r->'user_name','site',r->'site','sentAt',r->'captured_at','syncedAt',r->'saved_at')));
  RETURN NEXT rec;
 END LOOP;
END;
$function$;
REVOKE ALL ON FUNCTION skimaru_private.progress_result_rows(boolean) FROM PUBLIC,anon,authenticated;
