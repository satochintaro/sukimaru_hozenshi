'use strict';
(()=>{
 const REG='skimaru-registration-v13',KEY='skimaruData';
 const labels={grade2:'今年は2級を受講',grade1:'今年は1級を受講',none:'今年は受講しない',manager:'管理者として利用'};
 const read=k=>{try{return JSON.parse(localStorage.getItem(k)||'{}');}catch{return {};}};
 const year=()=>new Date(Date.now()+9*3600000).getUTCFullYear();
 let layer=null,running=null,revision=0,ready=false;
 function snapshot(){const r=read(REG),p=read(KEY),e=r.enrollment;return r.playerNo===p.playerNo&&e?.year===year()&&Object.hasOwn(labels,e.kind)?{...e}:null;}
 function persist(value,owner){const r=read(REG);if(r.playerNo!==owner.playerNo||r.token!==owner.token)throw Error('登録者が変わりました。画面を開き直してください。');localStorage.setItem(REG,JSON.stringify({...r,enrollment:value}));window.dispatchEvent(new Event('skimaru-enrollment'));}
 function close(){if(!layer)return;const d=layer;layer=null;d.frozen.forEach(el=>{if(el.isConnected)el.inert=false;});d.remove();d.previous?.isConnected&&d.previous.focus({preventScroll:true});}
 function ensure(edit=false){
  if(!window.SKIMARU_MEMBER?.valid())return false;
  if(!edit&&snapshot())return true;
  if(document.querySelector('.member-gate'))return false;
  if(layer)return false;
  const d=document.createElement('div');d.className='member-gate enrollment-gate';d.setAttribute('role','dialog');d.setAttribute('aria-modal','true');d.setAttribute('aria-labelledby','enrollment-title');
  d.innerHTML='<form class="member-card"><small>受講者ごとの成績集計のために</small><h2 id="enrollment-title"></h2><p>今年の区分を1つ選んでください。どの区分でも、1級・2級の問題は自由に学べます。</p><label for="enrollment-kind">今年の区分</label><select id="enrollment-kind" required><option value="">選択してください</option></select><p class="enrollment-role-note">「管理者」は利用区分です。管理画面の閲覧には別途、管理者ログインが必要です。</p><p class="member-error" role="alert"></p><button type="submit">保存して学習を続ける</button><p class="enrollment-local-note">学習記録はそのまま残ります。オフライン時は端末に保存し、通信が戻ると区分を同期します。</p></form>';
  d.querySelector('h2').textContent=year()+'年、何級を受講しますか？';
  for(const [key,label] of Object.entries(labels))d.querySelector('select').add(new Option(label,key));
  d.querySelector('select').value=snapshot()?.kind||'';
  d.previous=document.activeElement;d.frozen=[...document.body.children].filter(e=>!e.inert&&!['SCRIPT','STYLE'].includes(e.tagName));d.frozen.forEach(e=>e.inert=true);layer=d;document.body.append(d);
  if(edit&&snapshot()){const b=document.createElement('button');b.type='button';b.className='member-cancel';b.textContent='キャンセル';b.onclick=close;d.querySelector('form').append(b);}
  d.querySelector('form').onsubmit=e=>{e.preventDefault();const kind=d.querySelector('select').value;if(!Object.hasOwn(labels,kind))return;const owner=read(REG);try{revision++;persist({year:year(),kind,pending:true,updatedAt:new Date().toISOString()},owner);close();sync();}catch{d.querySelector('.member-error').textContent='保存できませんでした。端末の空き容量を確認してください。';}};
  d.addEventListener('keydown',e=>{if(e.key==='Tab'){const els=[...d.querySelectorAll('select,button')],first=els[0],last=els.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});d.querySelector('select').focus();return false;
 }
 async function sync(){
  if(running)return running;if(!navigator.onLine||!window.SKIMARU_MEMBER?.valid())return;
  const owner=read(REG),local=snapshot(),rev=revision;
  if(!owner.confirmed){try{await window.SKIMARU_MEMBER.checkRegistration(true);}catch{return;}}
  if(!read(REG).confirmed)return;
  const c=window.SKIMARU_SUPABASE;if(!c?.url)return;
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);
  running=(async()=>{try{
   const response=await fetch(c.url+'/rest/v1/rpc/skimaru_player_enrollment',{method:'POST',headers:{apikey:c.publishableKey,'Content-Type':'application/json'},body:JSON.stringify({p_player_no:owner.playerNo,p_token:owner.token,p_kind:local?.pending?local.kind:null}),cache:'no-store',signal:controller.signal});
   if(!response.ok)throw Error('同期できません');const remote=await response.json();if(rev!==revision)return;
   if(remote.year===year()&&Object.hasOwn(labels,remote.kind)){persist({...remote,pending:false},owner);if(layer&&!layer.querySelector('select').value)close();}
   else if(!local){ensure();}
  }catch{/* Keep the local choice and all learning data; retry on reconnect. */}finally{clearTimeout(timer);running=null;if(rev!==revision&&snapshot()?.pending)setTimeout(sync,0);}})();return running;
 }
 function badge(){
  document.querySelectorAll('[data-enrollment-edit]').forEach(button=>button.remove());
 }
 function boot(){ready=true;badge();if(window.SKIMARU_MEMBER?.valid()){ensure();sync();}let scheduled=false;new MutationObserver(()=>{if(!scheduled){scheduled=true;requestAnimationFrame(()=>{scheduled=false;badge();if(!snapshot()&&window.SKIMARU_MEMBER?.valid())ensure();});}}).observe(document.body,{childList:true,subtree:true});}
 window.SKIMARU_ENROLLMENT={year,labels,snapshot,ensure,edit:()=>ensure(true),sync};
 document.addEventListener('click',e=>{if(layer&&!e.target.closest('.enrollment-gate,.rollout-overlay')){e.preventDefault();e.stopImmediatePropagation();}},true);
 document.readyState==='loading'?document.addEventListener('DOMContentLoaded',boot):boot();
 window.addEventListener('skimaru-registered',()=>{ensure();sync();});window.addEventListener('online',sync);window.addEventListener('skimaru-enrollment',badge);
 window.addEventListener('storage',e=>{if(!e.key||e.key===REG||e.key===KEY){revision++;close();if(ready){badge();ensure();sync();}}});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden){ensure();sync();}});
 setInterval(()=>{if(!document.hidden&&snapshot()?.pending)sync();},60000);
})();
