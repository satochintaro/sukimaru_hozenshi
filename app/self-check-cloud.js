"use strict";
(()=>{
 const ui=window.SKIMARU_SELF_CHECK_UI,core=window.SKIMARU_SELF_CHECK,config=window.SKIMARU_SUPABASE;
 if(!ui||!core)return;
 const states=new Map(),owner=String(ui.owner),grade=()=>document.getElementById('grade').value;
 const recordKey=g=>'skimaru-self-check-2026:'+owner+':'+g,outboxKey=g=>'skimaru-self-check-outbox-2026:'+owner+':'+g;
 const empty=()=>({academic:{},practical:{}}),has=p=>Object.keys(p.academic).length+Object.keys(p.practical).length>0;
 function notice(g,text){if(String(g)===grade())document.getElementById('cloud-saved').textContent=text;}
 function read(key,fallback){try{return JSON.parse(localStorage.getItem(key)||'null')||fallback;}catch{return fallback;}}
 function credential(){const r=read('skimaru-registration-v13',{});return String(r.playerNo)===owner&&/^[a-f0-9]{64}$/.test(r.token||'')?r:null;}
 function parse(value){try{return core.parse(value||'');}catch{return {};}}
 const serialize=values=>Object.entries(values).sort(([a],[b])=>a.localeCompare(b,undefined,{numeric:true})).map(([id,v])=>id+' '+v).join('\n');
 function getState(g){g=String(g);if(states.has(g))return states.get(g);const record=read(recordKey(g),{}),outbox=read(outboxKey(g),{});const s={grade:g,base:{academic:parse(record.academic),practical:parse(record.practical)},pending:outbox.pending||empty(),inflight:outbox.inflight||null,hydrated:false,hydrating:false,busy:false,timer:null,attempt:0};if(!s.pending.academic||!s.pending.practical)s.pending=empty();states.set(g,s);return s;}
 function persist(s){try{if(s.inflight||has(s.pending))localStorage.setItem(outboxKey(s.grade),JSON.stringify({inflight:s.inflight,pending:s.pending}));else localStorage.removeItem(outboxKey(s.grade));}catch{notice(s.grade,'送信待ちの保存に失敗しました。回答をバックアップしてください。');}}
 async function rpc(name,g,args={}){const r=credential();if(!r||!config?.url||!config?.publishableKey)throw Error('registration_required');const ctl=new AbortController(),timeout=setTimeout(()=>ctl.abort(),12000);try{const response=await fetch(config.url+'/rest/v1/rpc/'+name,{method:'POST',headers:{apikey:config.publishableKey,'Content-Type':'application/json'},body:JSON.stringify({p_player_no:r.playerNo,p_token:r.token,p_year:2026,p_grade:Number(g),...args}),signal:ctl.signal,keepalive:true,cache:'no-store',credentials:'omit'});const data=await response.json();if(!response.ok||!data||data.error)throw Error('sync_failed');if(!credential()||credential().token!==r.token)throw Error('registration_changed');return data;}finally{clearTimeout(timeout);}}
 function merge(s,data){const academic={...(data.academic||{}),...(s.inflight?.academic||{}),...s.pending.academic},practical={...(data.practical||{}),...(s.inflight?.practical||{}),...s.pending.practical};s.base={academic,practical};const old=read(recordKey(s.grade),{}),record={...old,academic:serialize(academic),practical:serialize(practical),variant:s.grade==='2'?'A':old.variant||'',at:new Date().toISOString()};try{localStorage.setItem(recordKey(s.grade),JSON.stringify(record));}catch{notice(s.grade,'回答を端末に保存できません。バックアップしてください。');}ui.applyCloud(s.grade,record);}
 function schedule(s,delay=800){clearTimeout(s.timer);s.timer=setTimeout(()=>{s.timer=null;flush(s);},delay);}
 function retry(s){s.attempt++;notice(s.grade,'端末に保存済み・データベースへの送信待ちです。');schedule(s,Math.min(30000,2000*2**Math.min(s.attempt,4)));}
 async function hydrate(s){
  if(s.hydrated||s.hydrating)return;s.hydrating=true;
  try{const data=await rpc('skimaru_self_check_read',s.grade);if(data.state!=='ready')throw Error();
   // Import answers entered before database sync existed, without replacing an
   // answer already saved by another device. Explicit pending edits take priority.
   for(const kind of ['academic','practical'])for(const [id,value]of Object.entries(s.base[kind]))if(!(id in (data[kind]||{}))&&!(id in s.pending[kind])&&!(id in (s.inflight?.[kind]||{})))s.pending[kind][id]=value;
   s.hydrated=true;s.attempt=0;persist(s);merge(s,data);
   if(s.inflight||has(s.pending))schedule(s,0);else notice(s.grade,data.savedAt?'データベースの回答を読み込みました。':'回答を入力するとデータベースにも保存します。');
  }catch{if(credential())retry(s);else notice(s.grade,'この端末に保存します。データベース保存にはプレイヤー登録が必要です。');}
  finally{s.hydrating=false;}
 }
 async function flush(s){
  if(s.busy||s.hydrating)return;if(!credential()){notice(s.grade,'この端末に保存します。データベース保存にはプレイヤー登録が必要です。');return;}
  if(!navigator.onLine){retry(s);return;}if(!s.hydrated){await hydrate(s);return;}if(!s.inflight&&!has(s.pending))return;
  if(!s.inflight){s.inflight={id:crypto.randomUUID(),academic:s.pending.academic,practical:s.pending.practical};s.pending=empty();persist(s);}
  s.busy=true;notice(s.grade,'データベースに保存中…');const batch=s.inflight;
  try{const data=await rpc('skimaru_self_check_save',s.grade,{p_change_id:batch.id,p_academic:batch.academic,p_practical:batch.practical});if(data.state!=='saved'||data.changeId!==batch.id)throw Error();s.inflight=null;s.attempt=0;persist(s);merge(s,data);notice(s.grade,'データベースに保存しました。');if(has(s.pending))schedule(s,0);}
  catch{persist(s);retry(s);}finally{s.busy=false;}
 }
 function localSaved(event){if(String(event.detail.owner)!==owner)return;const s=getState(event.detail.grade),record=event.detail.record,next={academic:parse(record.academic),practical:parse(record.practical)};for(const kind of ['academic','practical'])for(const [id,value]of Object.entries(next[kind]))if(s.base[kind][id]!==value)s.pending[kind][id]=value;s.base=next;persist(s);if(s.inflight||has(s.pending)){notice(s.grade,'端末に保存済み・データベースへの送信待ちです。');schedule(s);}}
 function activate(){const s=getState(grade());if(!credential()){notice(s.grade,'この端末に保存します。データベース保存にはプレイヤー登録が必要です。');return;}if(!s.hydrated)hydrate(s);else if(s.inflight||has(s.pending))schedule(s,0);else notice(s.grade,'データベースと同期済みです。');}
 document.addEventListener('self-check-local-saved',localSaved);document.addEventListener('self-check-grade-loaded',activate);
 window.addEventListener('online',()=>{for(const s of states.values())schedule(s,0);});window.addEventListener('pagehide',()=>{for(const s of states.values()){persist(s);flush(s);}});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)activate();else for(const s of states.values())if(s.inflight||has(s.pending))flush(s);});
 // State exists before the first tap, so the first edit is included in the patch.
 getState(grade());activate();
})();
