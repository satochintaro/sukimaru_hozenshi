'use strict';
(()=>{
 const REG='skimaru-registration-v13',MARK='skimaru-device-recovery-v1653',SAFETY='skimaru-device-recovery-safety-v1653';
 const read=k=>{try{return JSON.parse(localStorage.getItem(k)||'null');}catch{return null;}};
 const nativeFetch=window.fetch.bind(window);let checking=false,shown=false;
 const allowed=k=>window.SKIMARU_BACKUP?.allowed(k);
 function hasProgress(){
  const u=read('skimaruData')||{},g=read('skimaru-grade1-v16')||{};
  if(Number(u.total)>0||Object.keys(u.stats||{}).length||Object.keys(g.questionStats||{}).length||(g.history||[]).length||Number(g.stats?.academic?.total)>0||Number(g.stats?.practical?.total)>0)return true;
  for(const x of [u.suddenDeath,g.suddenDeath])if(x&&(Number(x.attempts)>0||Number(x.totalAnswers)>0||(x.history||[]).length||x.current))return true;
  if((read('skimaruExamHistory_v1')||[]).length)return true;
  // Unrecognized practical records are retained for manual reconciliation, never replaced blindly.
  for(const k of Object.keys(localStorage))if(/^skimaru(Early_|Practical)/.test(k)){const v=read(k);if(v&&JSON.stringify(v)!=='{}'&&JSON.stringify(v)!=='[]')return true;}
  return false;
 }
 async function rpc(r,job=null,action='poll'){const c=window.SKIMARU_SUPABASE,ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),15000);try{const res=await nativeFetch(c.url+'/rest/v1/rpc/skimaru_player_recovery',{method:'POST',headers:{apikey:c.publishableKey,'Content-Type':'application/json'},body:JSON.stringify({p_player_no:r.playerNo,p_token:r.token,p_job:job,p_action:action}),signal:ctl.signal,cache:'no-store'});const j=await res.json();if(!res.ok||j.error)throw Error('recovery_failed');return j;}finally{clearTimeout(timer);}}
 async function apply(j,r){
  const currentJob=await rpc(r,j.id);if(currentJob.state!=='pending'||currentJob.id!==j.id)throw Error('recovery_unavailable');
  if(j.targetNo!==r.playerNo||read(REG)?.token!==r.token||j.backup?.schema!==1||!j.backup.entries?.skimaruData)throw Error('invalid_backup');
  const entries={};for(const [k,v]of Object.entries(j.backup.entries)){if(!allowed(k)||typeof v!=='string')throw Error('invalid_backup');JSON.parse(v);entries[k]=v;}
  if(hasProgress())throw Error('target_has_progress');
  window.SKIMARU_SYNC?.pause();const prior={};let mutated=false;try{
   for(const k of Object.keys(localStorage))if(allowed(k))prior[k]=localStorage.getItem(k);
   // A durable safety copy must succeed before the first replacement.
   localStorage.setItem(SAFETY,JSON.stringify({schema:1,entries:prior,job:j.id,savedAt:new Date().toISOString()}));
   if(hasProgress()||read(REG)?.token!==r.token)throw Error('target_changed');
   const pending='skimaru-pending-submissions-v1';delete entries[pending];
   for(const k of ['skimaruData','skimaruDataAutoBackup'])if(entries[k]){const u=JSON.parse(entries[k]);delete u.registrationV13;delete u.registrationV15;Object.assign(u,{playerNo:r.playerNo,name:r.name,site:r.site});entries[k]=JSON.stringify(u);}
   mutated=true;for(const k of Object.keys(prior))if(k!==pending)localStorage.removeItem(k);
   for(const [k,v]of Object.entries(entries))localStorage.setItem(k,v);
   localStorage.setItem(MARK,JSON.stringify({id:j.id,playerNo:r.playerNo}));
  }catch(e){
   // Only roll back if all current values were captured before mutation.
   if(mutated){for(const k of Object.keys(localStorage))if(allowed(k))localStorage.removeItem(k);for(const [k,v]of Object.entries(prior))localStorage.setItem(k,v);}
   window.SKIMARU_SYNC?.resume();throw e;
  }
  location.reload();
 }
 function offer(j,r){shown=true;const d=document.createElement('div');d.className='member-gate cloud-dialog';d.setAttribute('role','dialog');d.setAttribute('aria-modal','true');d.setAttribute('aria-label','学習データを復元');const c=document.createElement('div');c.className='member-card';c.innerHTML='<h2>学習データを復元</h2><p>開発者が以前の学習記録を準備しました。元の記録と、この端末の復元前の記録を残して復元します。</p><p data-saved></p><p data-status role="status"></p><button type="button" data-apply>学習データを復元</button><button type="button" data-close>あとで</button>';c.querySelector('[data-saved]').textContent='保存日時：'+new Date(j.savedAt).toLocaleString('ja-JP');d.append(c);document.body.append(d);c.querySelector('[data-close]').onclick=()=>d.remove();const b=c.querySelector('[data-apply]');b.onclick=async()=>{b.disabled=true;try{const run=()=>apply(j,r);if(navigator.locks)await navigator.locks.request('skimaru-device-recovery',run);else await run();}catch(e){c.querySelector('[data-status]').textContent=/target/.test(e.message)?'この端末に新しい学習記録があります。上書きせず停止しました。開発者に連絡してください。':'復元できませんでした。端末の空き容量・通信を確認してください。復元前の記録は保持しています。';b.disabled=false;}};b.focus();}
 async function check(){if(checking||document.hidden||document.body.classList.contains('game-title')||!navigator.onLine)return;const r=read(REG);if(!r?.confirmed||!r.token||!window.SKIMARU_BACKUP)return;checking=true;try{const m=read(MARK);if(m?.playerNo===r.playerNo){const a=await rpc(r,m.id,'ack');if(a.state==='applied'||a.state==='none')localStorage.removeItem(MARK);return;}if(shown)return;const j=await rpc(r);if(j.state==='pending')offer(j,r);}catch{}finally{checking=false;}}
 document.addEventListener('DOMContentLoaded',check);window.addEventListener('online',check);document.addEventListener('visibilitychange',check);setInterval(check,60000);
 window.SKIMARU_DEVICE_RECOVERY={check,hasProgress};
})();
