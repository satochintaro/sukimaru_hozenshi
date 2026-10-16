"use strict";
(() => {
 if(window.SKIMARU_PAGE_LOADING)return;
 const base=new URL('./',document.currentScript.src),home=new URL('../index.html#grades',base);
 const optional=new Set(['page-loading-v1651.js','progress-metadata-v1633.js','progress-sync-v1633.js','player-usage-v1631.js','player-follow-v1632.js']);
 const finished=new WeakSet(),pending=new Set(),failed=new Set(),decoded=new WeakMap(),backgrounds=new Map(),holds=new Set();
 let active=true,departing=false,shown=true,checking=false,initial=true,loaded=document.readyState==='complete',revision=1,lastChange=performance.now(),started=performance.now(),showTimer=null,hideTimer=null,watchdog=null,pollTimer=null,marker=null,target=null;
 const gear=(filled=false)=>{const points=[];for(let i=0;i<64;i++){const a=i*Math.PI/32,r=[43,43,35,35][i%4];points.push((50+Math.cos(a)*r).toFixed(2)+','+(50+Math.sin(a)*r).toFixed(2));}return '<svg viewBox="0 0 100 100" aria-hidden="true"><polygon points="'+points.join(' ')+'" fill="'+(filled?'currentColor':'none')+'" stroke="currentColor" stroke-width="1.25" stroke-linejoin="round"/><circle cx="50" cy="50" r="19" fill="'+(filled?'#f7f6f1':'none')+'" stroke="currentColor" stroke-width="1.25"/></svg>';};
 const gate=document.createElement('div');gate.id='skimaru-page-loading';gate.dataset.state='loading';gate.setAttribute('role','status');gate.setAttribute('aria-live','polite');gate.setAttribute('aria-label','画面を準備しています');gate.style.cssText='position:fixed;inset:0;z-index:2147483000;background:#f7f6f1;color:#174b3e;display:grid;place-items:center;';gate.style.setProperty('--pl-robot','url("'+new URL('loading-robot-v1651.png?v=16.65',base).href+'")');
 gate.innerHTML='<div class="pl-gears">'+Array.from({length:4},()=>'<span class="pl-bg-gear">'+gear()+'</span>').join('')+'</div><div class="pl-center" style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);text-align:center"><span class="pl-spinner" style="display:block;width:44px;height:44px;margin:0 auto 16px" aria-hidden="true">'+gear(true)+'</span><p>NOW LOADING</p></div><div class="pl-brand">スキマル保全士</div><div class="pl-content"><div class="pl-scene" aria-hidden="true"><div class="pl-floor"></div><div class="pl-mover"><div class="pl-shadow"></div><div class="pl-robot"><span class="pl-fallback">⚙</span></div></div><span class="pl-work-gear">'+gear(true)+'</span></div><div class="pl-track" aria-hidden="true"><i></i></div><h2>画面を準備しています</h2><p class="pl-message">もう少しお待ちください</p><div class="pl-actions" hidden><button type="button" data-load-retry>再読み込み</button><button type="button" data-load-back>前の画面へ</button></div></div>';
 // Outside body so existing registration dialogs never make this overlay inert.
 document.documentElement.append(gate);
 try{gate.classList.toggle('pl-reduced',JSON.parse(localStorage.getItem('skimaru-title-preferences-v1634')||'{}').reducedMotion===true);}catch{}
 const art=new Image();art.onerror=()=>gate.classList.add('pl-no-art');art.src=new URL('loading-robot-v1651.png?v=16.65',base).href;
 function busy(value){if(document.body){if(value)document.body.setAttribute('aria-busy','true');else document.body.removeAttribute('aria-busy');}}
 function present(){if(!active)return;shown=true;gate.hidden=false;gate.style.display='grid';busy(true);motion();}
 function begin(options={}){
  revision++;active=true;departing=options.departing===true;target=options.target||null;started=performance.now();lastChange=started;clearTimeout(showTimer);clearTimeout(hideTimer);clearTimeout(watchdog);
  gate.dataset.state='loading';gate.setAttribute('role','status');gate.setAttribute('aria-label','画面を準備しています');gate.querySelector('h2').textContent='画面を準備しています';gate.querySelector('.pl-message').textContent='もう少しお待ちください';gate.querySelector('.pl-actions').hidden=true;
  if(options.immediate||shown)present();else showTimer=setTimeout(present,250);
  watchdog=setTimeout(()=>{if(active)error();},25000);poll();check();return revision;
 }
 function error(){if(!active)return;clearTimeout(showTimer);gate.dataset.state='error';present();gate.setAttribute('role','alert');gate.setAttribute('aria-label','読み込みを確認してください');gate.querySelector('h2').textContent='読み込みを確認してください';gate.querySelector('.pl-message').textContent=(navigator.onLine?'読み込みを完了できませんでした。':'オフラインです。通信が戻ってから再試行してください。')+' 学習記録は端末に残っています。';gate.querySelector('.pl-actions').hidden=false;gate.querySelector('[data-load-retry]').focus({preventScroll:true});}
 function hide(){active=false;departing=false;target=null;shown=false;clearTimeout(showTimer);clearTimeout(watchdog);busy(false);gate.hidden=true;gate.style.display='none';}
 function finish(id){if(!active||id!==revision||departing||gate.dataset.state==='error')return;active=false;initial=false;clearTimeout(showTimer);clearTimeout(watchdog);busy(false);if(!shown){hide();return;}gate.dataset.state='done';hideTimer=setTimeout(()=>{if(!active)hide();},180);}
 function resource(el){if(el.tagName==='SCRIPT')return !!el.src&&!optional.has(new URL(el.src,base).pathname.split('/').pop());return el.tagName==='LINK'&&el.rel==='stylesheet'&&!el.disabled;}
 function watch(el){if(!resource(el)||finished.has(el))return;if(el.tagName==='LINK'&&el.sheet){finished.add(el);return;}pending.add(el);}
 document.addEventListener('load',e=>{const el=e.target;if(el?.tagName==='SCRIPT'||el?.tagName==='LINK'){finished.add(el);pending.delete(el);failed.delete(el);lastChange=performance.now();check();}},true);
 window.addEventListener('error',e=>{const el=e.target;if(el===art)return;if(el?.tagName==='SCRIPT'||el?.tagName==='LINK'){finished.add(el);pending.delete(el);if(resource(el))failed.add(el);if(active)check();}},true);
 function visible(el){if(!el.isConnected||el.closest('[hidden],template'))return false;const r=el.getBoundingClientRect(),s=getComputedStyle(el);return r.width>0&&r.height>0&&r.bottom>0&&r.right>0&&r.top<innerHeight&&r.left<innerWidth&&s.visibility!=='hidden'&&s.display!=='none';}
 function imageReady(img){
  const src=img.currentSrc||img.src;if(!src)return true;
  let state=decoded.get(img);if(state?.src!==src){state={src,ready:false,error:false};decoded.set(img,state);if(img.complete&&img.naturalWidth){Promise.resolve(img.decode?.()).then(()=>{state.ready=true;check();},()=>{state.error=true;check();});}else if(img.complete){state.error=true;}else{const done=()=>{decoded.delete(img);check();};img.addEventListener('load',done,{once:true});img.addEventListener('error',done,{once:true});}}
  if(state.error)throw Error('image');return state.ready;
 }
 function backgroundReady(url){let state=backgrounds.get(url);if(!state){state={ready:false,error:false};backgrounds.set(url,state);const img=new Image();img.onload=()=>Promise.resolve(img.decode?.()).then(()=>{state.ready=true;check();},()=>{state.error=true;check();});img.onerror=()=>{state.error=true;check();};img.src=url;}if(state.error)throw Error('background');return state.ready;}
 function assetsReady(){
  let ready=true;
  for(const img of document.images)if(visible(img)&&!img.closest('#skimaru-page-loading')&&!imageReady(img))ready=false;
  const candidates=document.querySelectorAll('.title-art,.sd-robot-art,[data-loading-background]');
  for(const el of candidates)if(visible(el)&&!(el.classList.contains('sd-robot-art')&&document.body.classList.contains('sd-art-unavailable'))){for(const match of getComputedStyle(el).backgroundImage.matchAll(/url\(["']?([^"')]+)["']?\)/g))if(!backgroundReady(new URL(match[1],location.href).href))ready=false;}
  return ready;
 }
 function contentReady(){
  const sd=document.getElementById('sd-root');if(sd&&!sd.children.length)return false;
  const main=document.getElementById('main');if(main&&!main.children.length)return false;
  const tools=document.getElementById('practical-tools-panel');if(tools&&!tools.hidden&&/読み込み中/.test(tools.querySelector('h2')?.textContent||''))return false;
  return !!document.body;
 }
 async function check(){
  if(checking||!active||departing||gate.dataset.state==='error')return;checking=true;const id=revision;
  try{
   for(const el of [...pending])if(!el.isConnected){pending.delete(el);failed.delete(el);}
   for(const el of [...failed])if(!el.isConnected)failed.delete(el);
   if(failed.size){error();return;}
   if(!loaded||pending.size||holds.size||!contentReady()||document.fonts?.status==='loading'||performance.now()-lastChange<180)return;
   if(!assetsReady())return;
   // Two paint opportunities after the final font/image/data/layout change.
   await new Promise(requestAnimationFrame);await new Promise(requestAnimationFrame);
   if(active&&id===revision&&!pending.size&&!holds.size&&document.fonts?.status!=='loading'&&performance.now()-lastChange>=180&&contentReady()&&assetsReady())finish(id);
  }catch{error();}finally{checking=false;}
 }
 function signature(){return [location.hash,document.body?.dataset.titleView,document.querySelector('body > section.active')?.id,document.querySelector('#header-title')?.textContent,document.querySelector('#main')?.firstElementChild,document.querySelector('#sc-quiz .q-card,#sd-root')?.firstElementChild,document.querySelector('[data-workspace][aria-current="page"]')?.dataset.workspace,document.querySelector('#sc-quiz .q-text,#sc-quiz .qt,#oneqPrompt')?.textContent,document.getElementById('results')?.classList.contains('hidden')];}
 function changed(){const next=signature();if(marker&&next.some((v,i)=>v!==marker[i])&&!initial&&!departing){if(!active)begin();else lastChange=performance.now();}marker=next;}
 new MutationObserver(records=>{
  let relevant=false;for(const r of records){if(gate.contains(r.target)||r.target===gate)continue;relevant=true;for(const node of r.addedNodes||[])if(node.nodeType===1){watch(node);for(const el of node.querySelectorAll?.('script[src],link[rel="stylesheet"]')||[])watch(el);}}
  if(relevant){lastChange=performance.now();changed();check();}
 }).observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class','hidden','src','href','aria-current'],characterData:true});
 // Only display-data requests hold the gate; analytics, sync and submissions never do.
 const originalFetch=window.fetch.bind(window);
 function displayRequest(input){try{const url=new URL(typeof input==='string'?input:input.url,location.href);if(url.origin===location.origin)return /\.(json|js)$/.test(url.pathname);return /\/auth\/v1\/(user|token)|\/rest\/v1\/(coach_settings|exam_results)|\/rpc\/skimaru_(developer_(progress_rows|progress_status|players|registrations|achievements|challenges)|manager_(rows|progress_status|enter|password|comparison|radar|accounts|access_history)|usage_(summary|error_details)|follow_context|audit_rows|challenge_leaderboard)/.test(url.pathname);}catch{return false;}}
 function hold(){const key={};holds.add(key);return ()=>{holds.delete(key);lastChange=performance.now();check();};}
 window.fetch=async function(input,init){if(!displayRequest(input))return originalFetch(input,init);const release=hold();try{const response=await originalFetch(input,init);await response.clone().arrayBuffer();return response;}finally{release();}};
 async function task(fn){const release=hold();if(!active)begin();try{return await fn();}finally{release();}}
 function navigate(url){const dest=new URL(url,location.href);begin({departing:true,target:dest.href,immediate:true});requestAnimationFrame(()=>requestAnimationFrame(()=>location.assign(dest.href)));}
 gate.querySelector('[data-load-retry]').onclick=()=>{if(target&&target!==location.href){navigate(target);return;}location.reload();};
 gate.querySelector('[data-load-back]').onclick=()=>{if(departing){hide();return;}if(history.length>1)history.back();else location.assign(home.href);};
 document.addEventListener('click',e=>{if(e.defaultPrevented||e.button!==0||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;const a=e.target.closest?.('a[href]');if(!a||a.hasAttribute('download')||a.target&&a.target!=='_self'||gate.contains(a)||a.hasAttribute('data-learning-link'))return;try{const url=new URL(a.href,location.href);if(url.origin!==location.origin||!/^https?:$/.test(url.protocol)||url.pathname===location.pathname&&url.search===location.search)return;if(!/\.html$|\/$/.test(url.pathname))return;for(const d of document.querySelectorAll('dialog[open]'))d.close();e.preventDefault();navigate(url.href);}catch{}},true);
 document.addEventListener('keydown',e=>{if(active&&shown&&!gate.contains(e.target))e.preventDefault();},true);
 window.addEventListener('hashchange',()=>{changed();check();});window.addEventListener('popstate',()=>{changed();check();});
 document.addEventListener('skimaru-workspace',()=>{if(!active)begin();check();});
 document.addEventListener('change',e=>{if(['usage-view-select','usage-days','usage-site','usage-grade','manager-grade','site-filter'].includes(e.target.id)){if(!active)begin();check();}});
 window.addEventListener('load',()=>{loaded=true;lastChange=performance.now();check();});
 window.addEventListener('pageshow',e=>{if(e.persisted){pending.clear();failed.clear();loaded=true;initial=false;marker=null;begin({immediate:true});}check();});
 document.addEventListener('DOMContentLoaded',()=>{busy(true);changed();check();});
 window.SKIMARU_PAGE_LOADING={begin:()=>begin(),task,hold,navigate,status:()=>({active,shown,state:gate.dataset.state,pendingResources:pending.size,pendingData:holds.size})};
 for(const el of document.querySelectorAll('script[src],link[rel="stylesheet"]'))watch(el);
 function poll(){if(pollTimer)return;pollTimer=setTimeout(()=>{pollTimer=null;if(active&&!departing&&gate.dataset.state!=='error'){changed();check();poll();}},120);}
 // Essential loading feedback must not be disabled by a page-wide animation:none rule.
 let motionFrame=null;
 const spinner=gate.querySelector('.pl-spinner'),rail=gate.querySelector('.pl-track i'),robot=gate.querySelector('.pl-robot'),mover=gate.querySelector('.pl-mover'),workGear=gate.querySelector('.pl-work-gear'),gears=[...gate.querySelectorAll('.pl-bg-gear')];
 function motion(){if(motionFrame!==null)return;motionFrame=requestAnimationFrame(tick);}
 function tick(now){
  motionFrame=null;if(!shown||!active||document.hidden||gate.dataset.state==='error')return;
  if(gate.dataset.state==='loading'){
   spinner.style.transform='rotate('+(now/1800*360%360)+'deg)';
   if(getComputedStyle(rail).animationName==='none')rail.style.transform='translateX('+((now%1450)/1450*510-110)+'%)';
   if(getComputedStyle(robot).animationName==='none'){
    const p=(now%7000)/7000,x=Math.min(p/.65,1)*105;
    mover.style.transform='translateX('+x+'px)';
    const i=p<.65?Math.floor(now/100)%6:6+Math.floor(now/360)%2;
    robot.style.backgroundPosition=(i%3*50)+'% '+(Math.floor(i/3)*50)+'%';
    robot.style.transform='translateY('+(-1.5+Math.sin(now/130)*1.5)+'px)';
   }
   if(getComputedStyle(workGear).animationName==='none')workGear.style.transform='rotate('+(now/3000*360%360)+'deg)';
   gears.forEach((g,i)=>{if(getComputedStyle(g).animationName==='none')g.style.transform='rotate('+((i%2?-1:1)*now/[36000,24000,18000,14000][i]*360%360)+'deg)';});
  }
  motionFrame=requestAnimationFrame(tick);
 }
 document.addEventListener('visibilitychange',()=>{if(!document.hidden&&shown&&active)motion();});
 motion();
 watchdog=setTimeout(()=>{if(active)error();},25000);poll();
})();
