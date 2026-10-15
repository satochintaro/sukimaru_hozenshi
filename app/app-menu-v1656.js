'use strict';
(()=>{
 const base=new URL('./',document.currentScript.src),root=new URL('../',base),VERSION='16.61';
 const read=(k,f={})=>{try{return JSON.parse(localStorage.getItem(k)||'null')||f;}catch{return f;}};
 const grade=()=>document.body.classList.contains('grade1-app')?1:/player|practical/.test(location.pathname)?2:Number(read('skimaru-last-grade-v1634',2));
 const svg=key=>key==='close'?(window.SKIMARU_CONTACT_UI?.svg(key)||''):window.SKIMARU_ICONS?.svg(key)||window.SKIMARU_CONTACT_UI?.svg(key)||'';
 let dialog,opener,view='menu',checking=false;
 function close(){dialog?.close();}
 function action(label,key,fn,attrs=''){const b=document.createElement('button');b.type='button';b.innerHTML=svg(key)+'<span></span>';b.querySelector('span:last-child').textContent=label;b.onclick=fn;if(attrs)b.dataset.titleAction=attrs;return b;}
 function external(fn){close();fn?.();}
 function preferenceGet(){if(window.SKIMARU_MENU_PREFERENCES)return window.SKIMARU_MENU_PREFERENCES.get();const d=grade()===1?read('skimaru-grade1-v16').settings:read('skimaruData');return {showWarn:true,useSRS:true,largeText:false,highContrast:false,...d};}
 function preferenceSet(key,value){if(window.SKIMARU_MENU_PREFERENCES)return window.SKIMARU_MENU_PREFERENCES.set(key,value);const k=grade()===1?'skimaru-grade1-v16':'skimaruData',d=read(k);if(grade()===1){d.settings={...preferenceGet(),[key]:value};}else d[key]=value;try{localStorage.setItem(k,JSON.stringify(d));return true;}catch{return false;}}
 function status(){const sync=window.SKIMARU_SYNC?.status(),latest=sync?.savedAt||read('skimaru-cloud-backup-v15').savedAt;const el=dialog?.querySelector('[data-save-status]');if(el)el.textContent=sync?.pending||sync?.error?sync.text:latest?'最終同期：'+new Date(latest).toLocaleString('ja-JP'):'学習記録は端末に保存され、オンライン時に自動同期します。';}
 function paragraph(text){const p=document.createElement('p');p.className='um-note';p.textContent=text;return p;}
 function boot(){
  // Replace the two title-only dialogs; all entry points now share this implementation.
  for(const id of ['game-menu-dialog','title-settings-dialog'])document.getElementById(id)?.remove();
  dialog=document.createElement('dialog');dialog.id='game-menu-dialog';dialog.className='unified-menu';dialog.setAttribute('aria-labelledby','um-heading');document.body.append(dialog);
  dialog.addEventListener('close',()=>{if(opener?.isConnected)opener.focus({preventScroll:true});});
  dialog.addEventListener('click',e=>{if(e.target!==dialog)return;const b=dialog.getBoundingClientRect();if(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom)close();});
  for(const id of ['title-menu-open','grade-menu','settings']){const b=document.getElementById(id);if(b){b.onclick=()=>open();b.dataset.sharedMenuOpen='';b.setAttribute('aria-label','メニュー');}}
  document.querySelectorAll('.hd-ico,.member-gear').forEach(b=>{b.onclick=()=>open();b.dataset.sharedMenuOpen='';b.setAttribute('aria-label','メニュー');b.innerHTML=svg('menu')||svg('gear');});
  document.querySelectorAll('.rollout-tools').forEach(el=>el.remove());
  document.getElementById('grade-manager')?.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();open('manager');},true);
  if(!document.querySelector('link[rel="apple-touch-icon"]')){const link=document.createElement('link');link.rel='apple-touch-icon';link.href=new URL('apple-touch-icon-v1657.png',base);document.head.append(link);}
  if(location.hash==='#settings')open();
 }
 function open(next='menu'){
  if(!dialog)return;view=next;
  if(!dialog.open)opener=document.activeElement;
  document.querySelectorAll('dialog[open]').forEach(d=>{if(d!==dialog)d.close();});
  dialog.replaceChildren();
  const header=document.createElement('header'),h=document.createElement('h2');h.id='um-heading';h.textContent=({menu:'メニュー',settings:'表示・出題設定',data:'データ管理',update:'アプリの更新',manager:'管理画面'})[next]||'メニュー';
  if(next!=='menu'){const back=action('戻る','back',()=>open());back.className='um-back';header.append(back);}header.append(h);
  const x=action('閉じる','close',close);x.className='um-close';x.setAttribute('aria-label','閉じる');header.append(x);dialog.append(header);
  const body=document.createElement('div');body.className='um-content';dialog.append(body);
  if(next==='menu')menu(body);
  if(next==='settings')settings(body);
  if(next==='data')data(body);
  if(next==='update')update(body);
  if(next==='manager')manager(body);
  if(!dialog.open)dialog.showModal();window.SKIMARU_CONTACT_UI?.decorate();status();
 }
 function menu(body){
  const p=read('skimaruData'),profile=action(p.name?p.site+' ／ '+p.name:'拠点・名前を登録','people',()=>external(()=>window.SKIMARU_MEMBER?window.SKIMARU_MEMBER.edit():location.assign(new URL(grade()===1?'grade1.html':'player.html',base))));profile.className='um-profile';body.append(profile);
  const grid=document.createElement('div');grid.className='game-menu-grid';grid.dataset.sharedMenuGrid='';
  for(const [label,key,fn,tag] of [
   ['お知らせ','mail',()=>external(()=>window.SKIMARU_SUPPORT?.mailbox()),'mail'],
   ['対応状況','clipboard',()=>external(()=>window.SKIMARU_SUPPORT?.reports()),'reports'],
   ['表示・出題設定','gear',()=>open('settings'),'settings'],
   ['データ管理','restore',()=>open('data'),'data'],
   ['不具合を報告','report',()=>external(()=>window.SKIMARU_SUPPORT?.report()),'report'],
   ['管理画面','people',()=>open('manager'),'manager']])grid.append(action(label,key,fn,tag));
  body.append(grid);
  const links=document.createElement('div');links.className='um-links';links.append(action('更新を確認','restore',()=>open('update')),action('使い方','book',()=>external(()=>window.SKIMARU_ROLLOUT?.guide('player'))));body.append(links);
  const version=document.createElement('small');version.className='um-version';version.textContent='スキマル保全士　Ver '+VERSION;body.append(version);
 }
 function toggle(body,label,checked,fn,note=''){
  const row=document.createElement('label');row.className='um-toggle';const text=document.createElement('span');text.textContent=label;if(note){const small=document.createElement('small');small.textContent=note;text.append(small);}const input=document.createElement('input');input.type='checkbox';input.checked=!!checked;input.onchange=()=>{if(fn(input.checked)===false){input.checked=!input.checked;dialog.querySelector('[data-setting-error]').textContent='設定を保存できませんでした。端末の空き容量を確認してください。';}};row.append(text,input);body.append(row);
 }
 function settings(body){
  body.append(paragraph(grade()+'級の学習設定'));
  const p=preferenceGet();for(const [key,label,note] of [['largeText','文字を大きく',''],['highContrast','文字・枠線をくっきり',''],['showWarn','過去の誤答に印をつける',''],['useSRS','忘れかけた問題を復習する','']])toggle(body,label,p[key],value=>preferenceSet(key,value),note);
  toggle(body,'動きを控えめにする',read('skimaru-title-preferences-v1634').reducedMotion,value=>{try{localStorage.setItem('skimaru-title-preferences-v1634',JSON.stringify({...read('skimaru-title-preferences-v1634'),reducedMotion:value}));document.body.classList.toggle('reduced-motion',value);return true;}catch{return false;}});
  const error=paragraph('');error.dataset.settingError='';error.setAttribute('role','status');body.append(error);
  body.append(action('通知・アイコンのバッジ','gear',()=>external(()=>window.SKIMARU_BADGES?.settings())));
 }
 function data(body){
  const p=read('skimaruData');body.append(paragraph('プレイヤーNo.　'+(p.playerNo||'未登録')));const state=paragraph('');state.dataset.saveStatus='';state.setAttribute('role','status');body.append(state);
  body.append(action('復旧コードを確認・控える','book',()=>{if(!read('skimaru-registration-v13').token){state.textContent='級を選び、拠点と名前を登録してください。';return;}external(()=>window.SKIMARU_BACKUP?.showCode());}),action('以前の登録・学習データを復元','restore',()=>external(()=>window.SKIMARU_BACKUP?.restore())),action('学習データをファイル保存','clipboard',()=>{try{if(window.SKIMARU_SYNC?.exportBackup){window.SKIMARU_SYNC.exportBackup();state.textContent='保存用ファイルを作成しました。';return;}const entries={};for(const k of Object.keys(localStorage)){if(window.SKIMARU_BACKUP?.allowed(k)){let value=localStorage.getItem(k);if(['skimaruData','skimaruDataAutoBackup'].includes(k)){const d=JSON.parse(value);delete d.registrationV13;delete d.registrationV15;value=JSON.stringify(d);}entries[k]=value;}}const url=URL.createObjectURL(new Blob([JSON.stringify({schema:1,entries,savedAt:new Date().toISOString()})],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='skimaru-learning-backup-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);state.textContent='保存用ファイルを作成しました。';}catch{state.textContent='保存用ファイルを作成できませんでした。';}}));
  const more=document.createElement('details');more.innerHTML='<summary>保存するデータについて</summary>';more.append(paragraph('成績・途中の回答・学習時間・設定を進捗共有と復旧のために自動保存します。改善のため閲覧・操作回数・滞在時間・端末の種類も記録します。利用分析にはパスワード・フォーム入力内容・解答内容を含めません。'));body.append(more);
 }
 function manager(body){for(const [label,file,key] of [['管理者','viewer.html','people'],['開発者','admin.html','chart']])body.append(action(label,key,()=>{try{localStorage.setItem('skimaru-role','manager');}catch{}if(window.SKIMARU_PAGE_LOADING)window.SKIMARU_PAGE_LOADING.navigate(new URL(file,base).href);else location.assign(new URL(file,base).href);}));}
 function update(body){
  const image=document.createElement('img');image.src=new URL('icon-v1657-192.png',base);image.alt='スキマル保全士のアイコン';image.className='um-app-icon';body.append(image,paragraph('使用中：Ver '+VERSION));
  const state=paragraph('アプリやサイトデータを削除せずに更新できます。');state.setAttribute('role','status');body.append(state);
  const check=action('更新を確認','restore',async()=>{
   if(checking)return;checking=true;check.disabled=true;state.textContent='更新を確認中…';const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
   try{
    const response=await fetch(new URL('manifest.webmanifest',root),{cache:'no-store',signal:controller.signal});if(!response.ok)throw Error();const manifest=await response.json();const target=new URL(manifest.start_url,root);if(target.origin!==location.origin)throw Error();
    const latest=target.searchParams.get('v');if(!latest||!manifest.icons?.length)throw Error();
    const html=await fetch(new URL('index.html',root),{cache:'no-store',signal:controller.signal});if(!html.ok||!/<html\b/i.test(await html.text()))throw Error();
    const icon=new URL(manifest.icons[0].src,root);if(icon.origin!==location.origin)throw Error();image.src=icon.href;
    if('serviceWorker'in navigator){const registrations=await navigator.serviceWorker.getRegistrations();await Promise.race([Promise.all(registrations.filter(reg=>reg.scope.startsWith(root.href)).map(reg=>reg.update())),new Promise((_,reject)=>setTimeout(()=>reject(Error('Update timeout')),8000))]);}
    state.textContent=latest===VERSION.replace('.','')?'このアプリは最新版です。':'新しいバージョンがあります。';
    check.querySelector('span:last-child').textContent='更新して開き直す';check.onclick=async()=>{check.disabled=true;try{await window.SKIMARU_SYNC?.capture();if(/同期の準備|大きく自動同期/.test(window.SKIMARU_SYNC?.status()?.error||''))throw Error('Capture failed');const url=new URL(location.href);url.searchParams.set('_update',Date.now());location.replace(url.href);}catch{state.textContent='学習記録の保存を確認できなかったため、開き直しを中止しました。';check.disabled=false;}};
   }catch{state.textContent='通信できませんでした。学習記録は端末に残っています。通信が戻ってから再度お試しください。';}finally{clearTimeout(timer);checking=false;check.disabled=false;}
  });body.append(check,paragraph('ホーム画面アイコンの反映時期は端末によって異なります。Androidではブラウザ側の更新確認が表示される場合があります。iPhoneの追加済みアイコンは、この更新ボタンでは変更できません。Safariで最新版を開き、ホーム画面に追加し直して確認してください。先に「データ・復元」から復旧コードを控えてください。'));
  body.append(action('新しいアイコンをホーム画面に追加','plus',()=>external(()=>window.SKIMARU_ROLLOUT?.install())));
 }
 document.addEventListener('click',e=>{const b=e.target.closest('#title-menu-open,#grade-menu,#settings,#sc-home .hd-ico,.practical-hd .member-gear');if(!b)return;e.preventDefault();e.stopImmediatePropagation();open();},true);
 window.SKIMARU_MENU={open,close,version:VERSION};
 window.addEventListener('skimaru-sync-status',status);
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
