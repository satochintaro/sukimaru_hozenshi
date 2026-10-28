"use strict";
(() => {
 if(document.getElementById('developer-self-check')||!document.querySelector('.manager-pad'))return;
 const host=document.createElement('div');host.id='developer-self-check';host.className='workspace-hidden';
 host.innerHTML='<div class="dsc-head"><div><h2>2026年度 自己採点</h2><p>DBに保存済みの回答を表示します。端末内だけの回答は含みません。</p></div><button type="button" data-refresh>更新</button></div><p data-status role="status"></p><div class="dsc-controls"><label>級<select data-grade><option value="2">2級</option><option value="1">1級</option></select></label><label>拠点<select data-site><option value="">全拠点</option></select></label><label class="dsc-search">名前・No.<input data-query type="search" placeholder="名前・プレイヤーNo." maxlength="80"></label></div><div class="dsc-counts" data-counts></div><p class="dsc-note" data-key-note></p><div data-list></div><div class="dsc-pages"><button type="button" data-prev>前へ</button><span data-page></span><button type="button" data-next>次へ</button></div>';
 document.querySelector('.manager-pad').append(host);
 const $=s=>host.querySelector(s),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let data=[],keys=null,page=0,loading=false,selected=false,generation=0,controller=null;
 const date=v=>new Date(v).toLocaleString('ja-JP',{timeZone:'Asia/Tokyo',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'});
 function questions(row,kind){const g=keys?.grades?.[String(row.grade)];return kind==='academic'?g?.academic:g?.variants?.A?.questions;}
 function result(row,kind){const qs=questions(row,kind),answers=row[kind]||{};return qs?.length?window.SKIMARU_SELF_CHECK.score(qs,answers):null;}
 function counts(answers){const values=Object.values(answers||{});return {entered:values.length,unknown:values.filter(v=>v==='?'||v==='？').length};}
 function metric(row,kind){const c=counts(row[kind]),r=result(row,kind),label=kind==='academic'?'学科':'実技（選択A）';return '<div><b>'+label+'</b><strong>'+(r?esc(r.correct)+' / '+esc(r.total)+' 正解':'採点データ未登録')+'</strong><small>入力 '+c.entered+(r?' / '+r.total:'')+'問'+(c.unknown?' · 不明 '+c.unknown+'問':'')+(r?' · 未入力 '+(r.total-c.entered)+'問':'')+'</small></div>';}
 function answerDetails(row,kind){const r=result(row,kind);if(!r)return '<p>正解データが未登録です。</p>';return '<div class="dsc-table"><table><thead><tr><th>番号</th><th>本人の回答</th><th>正解</th><th>照合</th></tr></thead><tbody>'+r.details.map(d=>'<tr><th>'+esc(d.id)+'</th><td>'+esc(d.answer==='?'?'不明':d.answer)+'</td><td>'+esc(d.correct)+'</td><td>'+(d.answer==='未回答'?'未入力':d.answer==='?'?'不明':d.ok?'一致':'不一致')+'</td></tr>').join('')+'</tbody></table></div>';}
 function render(){
  const grade=$('[data-grade]').value,site=$('[data-site]').value,query=$('[data-query]').value.trim().toLocaleLowerCase();
  const list=data.filter(r=>String(r.grade)===grade&&(!site||r.site===site)&&(!query||(r.name+' '+r.playerNo+' '+r.site).toLocaleLowerCase().includes(query)));
  const totalPages=Math.max(1,Math.ceil(list.length/8));page=Math.min(page,totalPages-1);
  const ac=list.filter(r=>counts(r.academic).entered>0).length,pr=list.filter(r=>counts(r.practical).entered>0).length;
  $('[data-counts]').innerHTML=[['保存済み',list.length+'人'],['学科入力あり',ac+'人'],['実技入力あり',pr+'人']].map(([a,b])=>'<div><small>'+a+'</small><b>'+b+'</b></div>').join('');
  const provisional=keys?.grades?.[grade]?.answerStatus!=='official';
  $('[data-key-note]').textContent=keys?(provisional?'暫定解答での照合です。正解数は公式の得点・合否ではありません。':'登録された公式解答での照合です。正解数は得点・正式な合否とは異なります。'):'正解データを取得できないため、入力状況のみ表示しています。';
  const target=$('[data-list]');target.replaceChildren();
  for(const row of list.slice(page*8,page*8+8)){
   const card=document.createElement('article');card.className='dsc-person';
   card.innerHTML='<header><b>'+esc(row.name)+'</b><small>'+esc(row.site||'拠点未設定')+' · '+esc(row.playerNo)+'</small></header><div class="dsc-scores">'+metric(row,'academic')+metric(row,'practical')+'</div><small>保存 '+esc(date(row.updatedAt))+'</small><details><summary>各問の回答を確認</summary><div class="dsc-detail-tabs"><button type="button" data-kind="academic" aria-pressed="true">学科</button><button type="button" data-kind="practical" aria-pressed="false">実技</button></div><div data-answers></div></details>';
   const details=card.querySelector('details');let kind='academic';
   details.addEventListener('toggle',()=>{if(details.open)card.querySelector('[data-answers]').innerHTML=answerDetails(row,kind);});
   card.querySelectorAll('[data-kind]').forEach(b=>b.onclick=()=>{kind=b.dataset.kind;card.querySelectorAll('[data-kind]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));card.querySelector('[data-answers]').innerHTML=answerDetails(row,kind);});target.append(card);
  }
  if(!list.length)target.textContent='この条件でDBに保存された回答はまだありません。';
  $('[data-page]').textContent=(page+1)+' / '+totalPages;$('[data-prev]').disabled=page===0;$('[data-next]').disabled=page>=totalPages-1;
 }
 async function load(){
  if(loading||!authenticated)return;loading=true;const gen=generation,rev=authRevision;controller=new AbortController();const current=()=>gen===generation&&authenticated&&rev===authRevision;
  const timeout=setTimeout(()=>controller?.abort(),15000);$('[data-refresh]').disabled=true;$('[data-status]').textContent='取得中…';
  try{
   if(!(await ensureSession()))throw Error('login');if(!current())return;
   const response=await fetch(CLOUD.url+'/rest/v1/rpc/skimaru_developer_self_check_rows',{method:'POST',headers:authHeaders(session.access_token),body:'{}',cache:'no-store',signal:controller.signal});
   const payload=await response.json();if(!response.ok||!Array.isArray(payload))throw Error(response.status===401||response.status===403?'login':'fetch');
   let nextKeys=null;try{const r=await fetch('./self-check-2026.json?t='+Date.now(),{cache:'no-store',signal:controller.signal});if(r.ok)nextKeys=await r.json();}catch{}
   if(!current())return;data=payload;keys=nextKeys;const site=$('[data-site]').value;
   $('[data-site]').replaceChildren(new Option('全拠点',''));for(const s of [...new Set(data.map(r=>r.site).filter(Boolean))].sort())$('[data-site]').add(new Option(s,s));$('[data-site]').value=[...$('[data-site]').options].some(x=>x.value===site)?site:'';
   render();$('[data-status]').textContent='取得 '+date(new Date())+' · 正解データ '+(keys?.revision||'未取得');
  }catch(e){if(current()){if(e.message==='login'){data=[];keys=null;render();}$('[data-status]').textContent=e.message==='login'?'開発者のログイン・権限を確認してください。':'取得できませんでした。表示中のデータは前回取得分です。「更新」で再試行してください。';}}
  finally{clearTimeout(timeout);if(gen===generation){loading=false;controller=null;$('[data-refresh]').disabled=false;}}
 }
 function clear(){generation++;controller?.abort();controller=null;loading=false;data=[];keys=null;page=0;selected=false;$('[data-query]').value='';$('[data-site]').replaceChildren(new Option('全拠点',''));$('[data-status]').textContent='開発者としてログインしてください。';$('[data-refresh]').disabled=false;render();}
 const oldShow=showLogin;showLogin=function(){clear();return oldShow.apply(this,arguments);};
 document.addEventListener('skimaru-workspace',e=>{selected=e.detail==='selfcheck';if(selected){render();load();}});
 window.addEventListener('skimaru-developer-open',clear);
 $('[data-refresh]').onclick=load;$('[data-prev]').onclick=()=>{page--;render();};$('[data-next]').onclick=()=>{page++;render();};
 ['[data-grade]','[data-site]'].forEach(s=>$(s).onchange=()=>{page=0;render();});$('[data-query]').oninput=()=>{page=0;render();};
 setInterval(()=>{if(!authenticated&&data.length)clear();},1000);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden&&selected)load();});
 render();
})();
