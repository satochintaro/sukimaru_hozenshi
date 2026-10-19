"use strict";
(() => {
 if(window.SKIMARU_SYNC)return;
 const REG='skimaru-registration-v13',PREFIX='skimaru-sync-v1633:',nativeFetch=window.fetch.bind(window);
 const originalSet=Storage.prototype.setItem,originalRemove=Storage.prototype.removeItem;
 const read=(k,f={})=>{try{return JSON.parse(localStorage.getItem(k)||'null')||f;}catch{return f;}};
 const put=(k,v)=>originalSet.call(localStorage,k,JSON.stringify(v));
 const n=(v,max=1000000)=>Math.min(max,Math.max(0,Math.round(Number(v)||0)));
 const allowed=k=>window.SKIMARU_BACKUP?.allowed(k)??(['skimaru-grade1-v16','skimaruData','skimaruDataAutoBackup','skimaru-submitted-v11','skimaru-pending-submissions-v1','skimaruExamHistory_v1','skimaru-study-time-v12','skimaru-cloud-backup-v15'].includes(k)||/^skimaru(Early_|Practical)/.test(k));
 let capturing=false,busy=false,timer=null,timerDue=0,lastAttempt=0,error='',errorKind='',failures=0,retryAt=0,paused=false,departing=false,departureHandled=false;
 function diagnostic(e,stage){try{window.SKIMARU_USAGE?.reportError?.(e,{stage,handled:true,departing});}catch{}}
 function preparationFailed(e,stage){errorKind='capture';error='自動同期の準備を完了できませんでした。学習記録は端末に残っており、次に開いたときに再送します。';diagnostic(e,stage);try{notify();}catch{}}
 const pageDevice=crypto.randomUUID(),locked=!!navigator.locks;
 const reg=()=>read(REG),key=()=>PREFIX+reg().playerNo;
 const withLock=fn=>locked?navigator.locks.request('skimaru-progress-v1633',fn):Promise.resolve().then(fn);
 const state=()=>read(key(),{sequence:0,queue:[]});
 const persist=s=>put(key(),s);
 const catName=c=>/安全/.test(c)?'安全・環境':/TPM|5S/.test(c)?'TPM・5S':/自主保全/.test(c)?'自主保全':/ロス|効率/.test(c)?'効率化とロス':/QC|IE|改善/.test(c)?'改善・解析':/図面|工具|測定/.test(c)?'図面・測定':/故障|潤滑|設備保全/.test(c)?'設備保全':c;
 function add(cats,cat,total,correct){if(!cat)return;const v=cats[cat]||(cats[cat]={t:0,c:0});v.t+=n(total);v.c+=Math.min(n(total),n(correct));}
 function metrics(entries){
  const get=(k,f={})=>{if(!entries[k])return f;const d=JSON.parse(entries[k]);return d??f;};
  const u=get('skimaruData'),g=get('skimaru-grade1-v16'),clock=get('skimaru-study-time-v12');
  const hs=[...new Map(get('skimaruExamHistory_v1',[]).filter(h=>h.completedAt).map((h,i)=>[h.id||'legacy-'+i,h])).values()];
  const out=[],meta=window.SKIMARU_PROGRESS_META||{},summary={version:12};
  for(const type of ['academic','practical']){
   const history=hs.filter(h=>h.kind===(type==='academic'?'gakka':'jitugi')).sort((a,b)=>String(a.completedAt).localeCompare(String(b.completedAt))),cats={},weak=new Map();let alerts=type==='academic'?(u.wrongIds||[]).slice(0,30).map(id=>({id,cat:meta.academic?.[id]||'',text:meta.academicText?.[id]||'問題 '+id})):[];
   let total=history.reduce((s,h)=>s+n(h.total),0)+(type==='academic'?n(u.total):0);
   let correct=history.reduce((s,h)=>s+Math.min(n(h.total),n(h.correct)),0)+(type==='academic'?Math.min(n(u.total),n(u.correct)):0);
   const scopes=Object.entries(clock).filter(([k])=>type==='academic'?k==='core'||k.includes('_gakka_')||k==='sudden-death-grade2':k.includes('_jitugi_')||k.startsWith('skimaruPractical'));
   let seconds=n(scopes.reduce((s,[,v])=>s+(Number(v.totalMs)||0),0)/1000,31536000),pendingAnswers=0;
   if(type==='academic')for(const [id,v]of Object.entries(u.stats||{}))add(cats,meta.academic?.[id],n(v.c)+n(v.w),v.c);
   if(type==='practical'){
    const legacy=get('skimaruPracticalDataTestV1');if(n(legacy.totalBlanks)>total){total=n(legacy.totalBlanks);correct=Math.min(total,n(legacy.correctBlanks));}
    for(const h of history){const info=meta.practical?.[h.year];if(!info)continue;for(const [id,v]of Object.entries(h.answers||{})){const q=info.questions[id];if(!q)continue;const letter=typeof v==='string'?v:q.options[typeof v==='number'?v:v?.picked];if(letter){add(cats,catName(q.category),1,+(letter===q.answer));weak.set(h.year+'-'+id,{id:h.year+'-'+id,year:h.year,cat:catName(q.category),text:q.text||'問題 '+id,correct:letter===q.answer,at:h.completedAt});}}}
   }
   if(type==='practical')alerts=[...weak.values()].filter(x=>!x.correct).sort((a,b)=>b.at.localeCompare(a.at)).slice(0,30);
   for(const k of Object.keys(entries)){
    if(type==='academic'?!/^skimaruEarly_.*_gakka_/.test(k):!Object.values(meta.practical||{}).some(v=>v.key===k))continue;
    const full=get(k),sessions=[full,...Object.values(full.taskSessions||{}),...Object.values(full.reviewSessions||{})];
    for(const s of sessions)if(!s.finished&&!s.completedAt)pendingAnswers+=Object.keys(s.answers||{}).length;
   }
   summary[type]={recent:window.SKIMARU_RECENT?.fromEntries(entries,2,type),...(window.SKIMARU_RECENT?.totals(u,type,{total:n(total),correct:Math.min(n(total),n(correct))})||{total:n(total),correct:Math.min(n(total),n(correct))}),seconds,timeMeasured:scopes.length>0,measuredSince:scopes.map(([,v])=>v.startedAt).filter(Boolean).sort()[0]||null};
   if(entries.skimaruData||history.length||pendingAnswers||seconds||total)out.push({grade:2,examType:type,...summary[type],pendingAnswers:n(pendingAnswers),cats,alerts,progressEpoch:u.progressEpoch||0,pastYearHistory:history.slice(-100).map(({answers,...h})=>h)});
  }
  for(const row of out)row.studyMetricsV12=summary;
  if(g.schema===1){
   const m={};for(const type of ['academic','practical']){const v=g.stats?.[type]||{};m[type]={recent:window.SKIMARU_RECENT?.fromEntries(entries,1,type),...(window.SKIMARU_RECENT?.totals(g,type,{total:n(v.total),correct:Math.min(n(v.total),n(v.correct))})||{total:n(v.total),correct:Math.min(n(v.total),n(v.correct))}),seconds:n(window.SKIMARU_RECENT?.studySeconds(1,type,entries)??v.seconds,31536000),timeMeasured:true};}
   for(const type of ['academic','practical']){
    const v=g.stats?.[type]||{},cats={};for(const [c,x]of Object.entries(v.cats||{}))add(cats,c,x.total??x.t,x.correct??x.c);
    const pending=g.activeMode===type?Object.keys(g.current?.answers||{}).filter(id=>!(g.current?.recorded||[]).includes(id)).length:0;
    out.push({grade:1,examType:type,...m[type],pendingAnswers:n(pending),cats,alerts:Object.entries(g.questionStats||{}).filter(([id,x])=>x.lastWrong&&meta.grade1?.[id]?.type===type).slice(0,30).map(([id])=>({id,cat:meta.grade1[id].category,text:meta.grade1[id].text,year:meta.grade1[id].year,number:meta.grade1[id].number})),studyMetricsV12:m,pastYearHistory:(g.history||[]).filter(h=>h.type===type).slice(-100).map(({answers,ids,...h})=>({...h,kind:type==='academic'?'gakka':'jitugi'}))});
   }
  }
  return out;
 }
 function backup(){
  window.SKIMARU_TIME?.exportData();const entries={};
  for(const k of Object.keys(localStorage).sort()){if(!allowed(k))continue;let value=localStorage.getItem(k);JSON.parse(value);
   if(k==='skimaruData'||k==='skimaruDataAutoBackup'){const d=JSON.parse(value);delete d.registrationV13;delete d.registrationV15;value=JSON.stringify(d);}entries[k]=value;
  }
  return {schema:1,entries};
 }
 const fingerprint=async b=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify({metricVersion:1675,entries:b.entries}))))).map(x=>x.toString(16).padStart(2,'0')).join('');
 function regressed(old,fresh){return old.metrics.some(m=>!fresh.metrics.some(x=>x.grade===m.grade&&x.examType===m.examType&&x.total>=m.total))||Object.keys(old.backup.entries).some(k=>!Object.hasOwn(fresh.backup.entries,k));}
 async function capture(){
  const r=reg();if(paused||departing||!r.confirmed||!r.playerNo||!r.token)return;
  try{await withLock(async()=>{if(paused||departing||reg().playerNo!==r.playerNo)return;capturing=true;try{
   const b=backup(),f=await fingerprint(b),s=state();if(f===s.fingerprint)return;const normalized=JSON.parse(JSON.stringify(b));delete normalized.entries['skimaru-study-time-v12'];delete normalized.entries['skimaru-cloud-backup-v15'];if(normalized.entries['skimaru-grade1-v16']){const g=JSON.parse(normalized.entries['skimaru-grade1-v16']);for(const v of Object.values(g.stats||{}))delete v.seconds;if(g.current)delete g.current.seconds;normalized.entries['skimaru-grade1-v16']=JSON.stringify(g);}const contentFingerprint=await fingerprint(normalized);if(contentFingerprint===s.contentFingerprint&&!s.queue?.length&&Date.now()-new Date(s.savedAt||0).getTime()<120000)return;
   if(new TextEncoder().encode(JSON.stringify(b)).length>2000000)throw Error('backup_large');
   if(!r.recoveryCode){r.recoveryCode=Array.from(crypto.getRandomValues(new Uint8Array(16)),v=>v.toString(16).padStart(2,'0')).join('');put(REG,r);}
   const sequence=n(s.sequence,Number.MAX_SAFE_INTEGER)+1,device=locked?(s.device||crypto.randomUUID()):pageDevice;
   const snap={id:crypto.randomUUID(),device,sequence,capturedAt:new Date().toISOString(),metrics:metrics(b.entries),backup:b};
   const queue=s.queue||[],previous=queue.at(-1);
   if(previous&&!regressed(previous,snap))queue.pop();
   queue.push(snap);persist({...s,sequence,device,fingerprint:f,contentFingerprint,queue});if(errorKind==='capture'){error='';errorKind='';}
  }catch(e){errorKind='capture';error=e.message==='backup_large'?'データが大きく自動同期できません。端末の記録は残っています。設定から学習データをファイル保存してください。':'自動同期の準備を保存できません。端末の記録は残っています。空き容量と保存設定を確認してください。';diagnostic(e,'capture');}finally{capturing=false;notify();}});}catch(e){preparationFailed(e,'capture_lock');}
 }
 async function send(){
  if(paused||busy||!reg().confirmed||!navigator.onLine)return;
  const c=window.SKIMARU_SUPABASE;if(!c?.url)return;
  if(errorKind==='registration')return;
  if(Date.now()<retryAt){schedule(retryAt-Date.now());return;}
  if(Date.now()-lastAttempt<6500){schedule(6500-(Date.now()-lastAttempt));return;}
  const r=reg(),storageKey=key(),snap=state().queue?.[0];if(!snap)return;
  busy=true;lastAttempt=Date.now();notify();let timedOut=false;const ctl=new AbortController(),timeout=setTimeout(()=>{timedOut=true;ctl.abort();},30000);
  try{
   const res=await nativeFetch(c.url+'/rest/v1/rpc/skimaru_progress_push',{method:'POST',headers:{apikey:c.publishableKey,'Content-Type':'application/json'},body:JSON.stringify({p_player_no:r.playerNo,p_token:r.token,p_recovery:r.recoveryCode,p_snapshot:snap}),cache:'no-store',signal:ctl.signal,keepalive:JSON.stringify(snap).length<50000});
   const j=await res.json();if(!res.ok||!['saved','stale'].includes(j.state)||j.id!==snap.id)throw Error(res.status===401||res.status===403?'authentication_failed':j.message||j.error||'sync_failed');
   await withLock(()=>{const s=read(storageKey);s.queue=(s.queue||[]).filter(x=>x.id!==snap.id);s.savedAt=j.savedAt;s.ackedId=snap.id;put(storageKey,s);});
   error='';errorKind='';failures=0;retryAt=0;
  }catch(e){
   errorKind=/authentication|registration/.test(e.message)?'registration':'network';
   error=errorKind==='registration'?'登録情報を確認できません。設定から復旧コードで復元してください。端末の記録は残っています。':timedOut?'通信に時間がかかっています。学習記録は端末に保存済みです。時間をおいて自動で再送します。':'通信できません。学習記録は端末に保存済みです。通信の回復を待って自動で再送します。';
   failures=Math.min(failures+1,3);retryAt=Date.now()+Math.min(120000,Math.round(30000*2**(failures-1)*(0.9+Math.random()*0.2)));
   diagnostic(timedOut?new DOMException('sync timeout','TimeoutError'):e,'send');
  }
  finally{clearTimeout(timeout);busy=false;notify();if(state().queue?.length&&errorKind!=='registration')schedule(error?Math.max(0,retryAt-Date.now()):6500);}
 }
 function schedule(ms=800){if(paused||departing)return;const due=Date.now()+ms;if(timer&&timerDue<=due)return;clearTimeout(timer);timerDue=due;timer=setTimeout(async()=>{timer=null;try{await capture();await send();}catch(e){preparationFailed(e,'scheduled');}},ms);}
 function status(){const s=state(),pending=s.queue?.length||0;return {savedAt:s.savedAt||null,pending,error,busy,retryAt:retryAt||null,text:!navigator.onLine?'オフラインです。学習記録は端末に保存し、通信が戻ると自動同期します。':error||(pending?(busy?'学習データを自動同期中…':'学習データを端末に保存しました。まもなく自動同期します。'):s.savedAt?'学習データは自動同期済みです。完了報告は任意です。':'学習データは自動同期します。完了報告は任意です。')};}
 function notify(){window.SKIMARU_MEMBER?.refresh();window.dispatchEvent(new CustomEvent('skimaru-sync-status',{detail:status()}));}
 Storage.prototype.setItem=function(k,v){const result=originalSet.call(this,k,v);if(this===localStorage&&!capturing&&(allowed(String(k))||k===REG))schedule(k==='skimaru-study-time-v12'?30000:800);return result;};
 Storage.prototype.removeItem=function(k){const result=originalRemove.call(this,k);if(this===localStorage&&!capturing&&allowed(String(k)))schedule();return result;};
 function resetRetry(){failures=0;retryAt=0;if(errorKind!=='capture'){error='';errorKind='';}}
 function exportBackup(){capturing=true;try{const b=backup();b.savedAt=new Date().toISOString();const url=URL.createObjectURL(new Blob([JSON.stringify(b)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='skimaru-learning-backup-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}finally{capturing=false;}}
 window.SKIMARU_SYNC={status,exportBackup,flush:async()=>{resetRetry();await capture();await send();},pause:()=>{paused=true;clearTimeout(timer);timer=null;},resume:()=>{paused=false;schedule();},capture};
 window.addEventListener('online',()=>{resetRetry();schedule();notify();});window.addEventListener('offline',notify);
 window.addEventListener('storage',e=>{if(allowed(e.key||''))schedule();else if(e.key?.startsWith(PREFIX))notify();});
 window.addEventListener('skimaru-registered',()=>{resetRetry();schedule();});
 // Do not start a new Web Lock or digest while the document is being deactivated.
 // Answers are already in localStorage; queued snapshots remain until acknowledged.
 function departure(){if(departureHandled)return;departureHandled=true;departing=true;clearTimeout(timer);timer=null;try{window.SKIMARU_TIME?.exportData();}catch(e){diagnostic(e,'departure');}try{send().catch(e=>preparationFailed(e,'departure'));}catch(e){preparationFailed(e,'departure');}}
 function resumePage(){departing=false;departureHandled=false;schedule(0);}
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)resumePage();else departure();});
 window.addEventListener('pagehide',departure);
 window.addEventListener('pageshow',resumePage);
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>schedule());else schedule();
 setInterval(()=>{if(!document.hidden)schedule(800);},30000);notify();
})();
