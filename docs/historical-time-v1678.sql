-- Restore only previously recorded time. No estimates, no updates to original backups.
CREATE OR REPLACE FUNCTION skimaru_private.historical_time_floor(p_no text,p_grade integer,p_type text,p_epoch numeric)
RETURNS numeric LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
 SELECT least(31536000,coalesce(max((m->>'seconds')::numeric),0))
 FROM skimaru_private.progress_versions v CROSS JOIN LATERAL jsonb_array_elements(v.metrics) m
 WHERE v.player_no=p_no AND m->>'grade'=p_grade::text AND m->>'examType'=p_type
 AND coalesce((m->>'progressEpoch')::numeric,0)=p_epoch AND m->>'timeMeasured'='true'
 AND m->>'seconds' ~ '^[0-9]{1,9}(\.[0-9]{1,6})?$';
$$;
REVOKE ALL ON FUNCTION skimaru_private.historical_time_floor(text,integer,text,numeric) FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION skimaru_private.metric_with_historical_time(m jsonb,p_no text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path='' AS $$
DECLARE seconds numeric; type text:=m->>'examType';
BEGIN
 IF m->>'grade' NOT IN ('1','2') OR type NOT IN ('academic','practical') THEN RETURN m; END IF;
 seconds:=greatest(coalesce((m->>'seconds')::numeric,0),skimaru_private.historical_time_floor(p_no,(m->>'grade')::integer,type,coalesce((m->>'progressEpoch')::numeric,0)));
 IF seconds<=coalesce((m->>'seconds')::numeric,0) THEN RETURN m; END IF;
 m:=m||jsonb_build_object('seconds',seconds,'timeMeasured',true,'recoveredTime',true);
 IF jsonb_typeof(m#>ARRAY['studyMetricsV12',type])='object' THEN
  m:=jsonb_set(m,ARRAY['studyMetricsV12',type],(m#>ARRAY['studyMetricsV12',type])||jsonb_build_object('seconds',seconds,'timeMeasured',true,'recoveredTime',true));
 END IF;
 RETURN m;
END;
$$;
REVOKE ALL ON FUNCTION skimaru_private.metric_with_historical_time(jsonb,text) FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION skimaru_private.player_time_floor(p_player_no text,p_token text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE result jsonb;
BEGIN
 IF skimaru_private.player_status(p_player_no,p_token)->>'state'<>'active' THEN RETURN jsonb_build_object('state','invalid'); END IF;
 SELECT coalesce(jsonb_agg(jsonb_build_object('grade',x.grade,'examType',x.type,'progressEpoch',x.epoch,'seconds',skimaru_private.historical_time_floor(p_player_no,x.grade,x.type,x.epoch))),'[]'::jsonb)
 INTO result FROM (SELECT DISTINCT (m->>'grade')::integer grade,m->>'examType' type,coalesce((m->>'progressEpoch')::numeric,0) epoch
 FROM skimaru_private.progress_heads h CROSS JOIN LATERAL jsonb_array_elements(h.metrics) m
 WHERE h.player_no=p_player_no AND m->>'grade' IN ('1','2') AND m->>'examType' IN ('academic','practical')) x;
 RETURN jsonb_build_object('state','active','rows',result);
END;
$$;
REVOKE ALL ON FUNCTION skimaru_private.player_time_floor(text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION skimaru_private.player_time_floor(text,text) TO anon,authenticated;
CREATE OR REPLACE FUNCTION public.skimaru_player_time_floor(p_player_no text,p_token text)
RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$ SELECT skimaru_private.player_time_floor(p_player_no,p_token); $$;
REVOKE ALL ON FUNCTION public.skimaru_player_time_floor(text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.skimaru_player_time_floor(text,text) TO anon,authenticated;
