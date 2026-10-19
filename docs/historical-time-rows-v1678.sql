CREATE OR REPLACE FUNCTION skimaru_private.progress_result_rows(p_history boolean DEFAULT false)
 RETURNS SETOF public.exam_results
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
   CROSS JOIN LATERAL (SELECT CASE WHEN h.version_id IS NOT NULL THEN skimaru_private.metric_with_historical_time(CASE WHEN jsonb_typeof(original.m#>'{studyMetricsV12,academic}')='object' AND backup.record IS NOT NULL
     THEN jsonb_set(top_metric.m,'{studyMetricsV12,academic}',skimaru_private.metric_with_challenge(original.m#>'{studyMetricsV12,academic}',backup.record,elapsed.seconds))
     ELSE top_metric.m END,s.player_no) ELSE top_metric.m END AS m) adjusted
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
$function$
