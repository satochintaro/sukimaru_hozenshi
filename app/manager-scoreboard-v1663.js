'use strict';
(()=>{
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const number=v=>Number.isFinite(Number(v))?Math.max(0,Number(v)):0;
 const at=r=>Date.parse(r.at||r.receivedAt||r.sentAt||'')||0;
 const key=r=>String(r.playerNo||r.player_no||r.key||('LEGACY:'+r.site+':'+r.name));
 const day=v=>new Date(v+9*3600000).toISOString().slice(0,10);
 const rate=(c,t)=>t?Math.round(c/t*1000)/10:null;
 const pct=v=>v===null?'—':Number(v).toLocaleString('ja-JP',{maximumFractionDigits:1})+'%';
 const band=v=>v===null?'none':v>=85?'good':v>=75?'watch':'low';
 const label=v=>v===null?'未学習':v>=85?'目標達成':v>=75?'目標まであと一歩':'最低ライン未満';
 const stamp=v=>v?new Date(v).toLocaleString('ja-JP',{timeZone:'Asia/Tokyo',month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'}):'記録なし';
 function measure(rows,mode){
  if(window.SKIMARU_METRICS){const m=window.SKIMARU_METRICS.metrics({rows},mode);return {...m,rate:rate(m.correct,m.total)};}
  let total=0,correct=0;
  for(const type of mode==='combined'?['academic','practical']:[mode]){const r=rows.filter(r=>r.examType===type).sort((a,b)=>at(a)-at(b)).at(-1);if(!r)continue;const m=r.raw?.studyMetricsV12?.[type]||r;const t=number(m.total);total+=t;correct+=Math.min(t,number(m.correct));}
  return {total,correct,rate:rate(correct,total)};
 }
 function people(data,grade,site,mode){
  const map=new Map(),roster=Array.isArray(data.roster)?data.roster:[];
  for(const r of roster){if(site&&r.site!==site)continue;const k=key(r);map.set(k,{key:k,name:r.name||r.user_name||'名前未登録',site:r.site||'',rows:[],excluded:false});}
  for(const r of data.rows||[]){if(Number(r.raw?.grade||2)!==grade||(site&&r.site!==site))continue;const k=key(r);if(!map.has(k))map.set(k,{key:k,name:r.name||'名前未登録',site:r.site||'',rows:[],excluded:false});const p=map.get(k);p.rows.push(r);p.excluded=p.excluded||data.excluded?.includes(k)||false;}
  const year=new Date(Date.now()+9*3600000).getUTCFullYear();
  return [...map.values()].map(p=>{const r=roster.find(r=>key(r)===p.key),enrollment=r?.enrollment,cohort=enrollment?.year===year&&['grade1','grade2','none','manager'].includes(enrollment.kind)?enrollment.kind:'unknown';return {...p,enrollment,cohort,target:!data.annual||cohort==='grade'+grade,excluded:data.excluded?.includes(p.key)||false,...measure(p.rows,mode),last:Math.max(0,...p.rows.filter(r=>mode==='combined'||r.examType===mode).map(at))};});
 }
 function aggregate(ps){const eligible=ps.filter(p=>!p.excluded&&p.target!==false),learned=eligible.filter(p=>p.total>0),total=learned.reduce((s,p)=>s+p.total,0),correct=learned.reduce((s,p)=>s+p.correct,0);return {registered:eligible.length,learned:learned.length,total,correct,rate:rate(correct,total),good:learned.filter(p=>p.rate>=85).length,low:learned.filter(p=>p.rate<75).length,unlearned:eligible.filter(p=>!p.total).length};}
 function series(ps,mode,days,now=Date.now()){
  const end=day(now),base=Date.parse(end+'T00:00:00+09:00'),dates=Array.from({length:days},(_,i)=>day(base-(days-1-i)*86400000));
  return dates.map(d=>{const cutoff=Date.parse(d+'T00:00:00+09:00')+86400000;const snapshots=ps.filter(p=>!p.excluded&&p.target!==false).map(p=>measure(p.rows.filter(r=>at(r)>0&&at(r)<cutoff),mode));const total=snapshots.reduce((s,p)=>s+p.total,0),correct=snapshots.reduce((s,p)=>s+p.correct,0);return {day:d,total,correct,rate:rate(correct,total)};});
 }
 function chart(points,title){
  const w=480,h=276,left=47,right=18,top=24,bottom=52,gw=w-left-right,gh=h-top-bottom;
  const x=i=>left+gw*(points.length>1?i/(points.length-1):.5),y=v=>top+(100-Math.max(50,Math.min(100,v)))/50*gh;
  let svg='<svg class="sb-chart" viewBox="0 0 '+w+' '+h+'" role="img" aria-label="'+esc(title)+'。縦軸50〜100パーセント。85パーセントが目標、75パーセントが最低ライン。"><title>'+esc(title)+'</title>';
  svg+='<rect x="'+left+'" y="'+top+'" width="'+gw+'" height="'+(y(85)-top)+'" fill="#e8f3ed"/><rect x="'+left+'" y="'+y(85)+'" width="'+gw+'" height="'+(y(75)-y(85))+'" fill="#fff6d9"/>';
  for(const v of [50,60,70,75,85,100])svg+='<line x1="'+left+'" x2="'+(w-right)+'" y1="'+y(v)+'" y2="'+y(v)+'" stroke="'+(v===85?'#248163':v===75?'#b88724':'#dce5df')+'" stroke-width="'+([75,85].includes(v)?1.6:1)+'" '+([75,85].includes(v)?'stroke-dasharray="5 4"':'')+'/><text x="'+(left-8)+'" y="'+(y(v)+4)+'" text-anchor="end" fill="'+([75,85].includes(v)?'#375d4d':'#718278')+'" font-size="12">'+v+'%</text>';
  let segment=[],has=false,below=false;const flush=()=>{if(segment.length>1)svg+='<polyline points="'+segment.join(' ')+'" fill="none" stroke="#175e49" stroke-width="3" stroke-linejoin="round"/>';segment=[];};
  points.forEach((p,i)=>{if(p.rate===null){flush();return;}has=true;below=below||p.rate<50;segment.push(x(i)+','+y(p.rate));});flush();
  points.forEach((p,i)=>{if(p.rate===null)return;if(p.rate<50)svg+='<path d="M'+(x(i)-4)+' '+(y(50)-6)+'h8l-4 7z" fill="#b24e3e"><title>'+p.day+' '+pct(p.rate)+'</title></path>';else if(i===points.length-1||points.length<=7)svg+='<circle cx="'+x(i)+'" cy="'+y(p.rate)+'" r="3.5" fill="#fff" stroke="#175e49" stroke-width="2"><title>'+p.day+' '+pct(p.rate)+'</title></circle>';});
  [...new Set([0,Math.floor((points.length-1)/2),points.length-1])].filter(i=>i>=0&&i<points.length).forEach(i=>svg+='<text x="'+x(i)+'" y="'+(h-23)+'" text-anchor="'+(i===0?'start':i===points.length-1?'end':'middle')+'" font-size="12" fill="#718278">'+points[i].day.slice(5).replace('-','/')+'</text>');
  if(!has)svg+='<text x="255" y="142" text-anchor="middle" font-size="15" fill="#718278">この期間の記録はありません</text>';
  svg+='</svg><div class="sb-chart-key"><span class="sb-key-good">85% 目標合格ライン</span><span class="sb-key-watch">75% 最低ライン</span></div>';
  return svg+(below?'<p class="sb-note">50%未満の値は下端の▼で表示。実際の値は日別データで確認できます。</p>':'');
 }
 function mount(host,getData){
  let mode='academic',grade=2,site='',days=30,query='',sort='low',status='all',cohortFilter='target',page=0,all=[],lastScope=null;const cohortLabel={grade1:'1級受講',grade2:'2級受講',none:'受講しない',manager:'管理者',unknown:'未設定'};
  host.className='manager-scoreboard';
  host.innerHTML='<div class="sb-intro"><div><p class="sb-eyebrow">LEARNING PROGRESS</p><h2>みんなの成績</h2><p>目標までの距離を、ひと目で。</p></div><span class="sb-version">v16.66</span></div><div class="sb-controls"><label>級<select data-sb-grade><option value="2">2級</option><option value="1">1級</option></select></label><label>拠点<select data-sb-site><option value="">全拠点</option></select></label><label>推移の期間<select data-sb-days><option value="7">7日</option><option value="30" selected>30日</option><option value="90">90日</option></select></label></div><div class="sb-modes" aria-label="成績の区分"><button type="button" data-sb-mode="academic" aria-pressed="true">学科</button><button type="button" data-sb-mode="practical" aria-pressed="false">実技</button><button type="button" data-sb-mode="combined" aria-pressed="false">総合</button></div><p class="sb-source" data-sb-source role="status"></p><div class="sb-stats" data-sb-stats></div><div class="sb-chart-card"><div class="sb-section-head"><div><h3>正答率の推移</h3><p>最新の累計記録を日ごとに集計</p></div><strong data-sb-trend-rate></strong></div><div data-sb-chart></div><details class="sb-daily"><summary>日別データを確認</summary><div data-sb-daily></div></details></div><div class="sb-section-head sb-people-head"><div><h3>登録者の成績</h3><p>名前をタップすると個人の推移を表示</p></div><span data-sb-count></span></div><div class="sb-search"><label>名前で検索<input type="search" data-sb-query placeholder="名前・拠点" maxlength="80"></label><label>並び順<select data-sb-sort><option value="low">正答率が低い順</option><option value="high">正答率が高い順</option><option value="total">回答数が多い順</option><option value="name">名前順</option><option value="latest">更新が新しい順</option></select></label></div><div class="sb-filter-chips" aria-label="達成状況"><button type="button" data-sb-status="all" aria-pressed="true">全員</button><button type="button" data-sb-status="low" aria-pressed="false">75%未満</button><button type="button" data-sb-status="watch" aria-pressed="false">75〜85%未満</button><button type="button" data-sb-status="good" aria-pressed="false">85%以上</button><button type="button" data-sb-status="none" aria-pressed="false">未学習</button></div><div class="sb-person-list" data-sb-list></div><div class="sb-pagination"><button type="button" data-sb-prev>前へ</button><span data-sb-page></span><button type="button" data-sb-next>次へ</button></div><p class="sb-note">正答率＝正解数÷回答数。総合は学科＋実技の回答数で集計。85%・75%はこのアプリの学習管理目標です。登録者は1・2級共通。未同期分は含みません。</p>';
  const q=s=>host.querySelector(s);
  const cohorts=document.createElement('label');cohorts.className='sb-cohort-filter';cohorts.innerHTML='表示する登録者<select data-sb-cohort><option value="target">集計対象の受講者</option><option value="all">全登録者</option><option value="grade2">2級受講</option><option value="grade1">1級受講</option><option value="none">受講しない</option><option value="manager">管理者</option><option value="unknown">未設定</option></select><small>上の人数・平均・推移は、選択した級の今年の受講者だけで集計します。</small>';q('.sb-search').before(cohorts);cohorts.querySelector('select').onchange=e=>{cohortFilter=e.target.value;page=0;list();};
  const cohortSummary=document.createElement('p');cohortSummary.className='sb-cohort-summary';q('[data-sb-stats]').before(cohortSummary);
  const exclusions=document.createElement('label');exclusions.className='sb-exclusion-filter';exclusions.hidden=true;exclusions.innerHTML='<input type="checkbox" data-sb-excluded> 除外中のメンバーを表示（開発者のみ）';q('[data-sb-list]').before(exclusions);
  exclusions.querySelector('input').onchange=()=>{page=0;list();};
  function list(){
   const excludedView=!!getData()?.manageExclusions&&exclusions.querySelector('input').checked;const filtered=all.filter(p=>p.excluded===excludedView&&(!getData()?.annual||excludedView||cohortFilter==='all'||(cohortFilter==='target'?p.target:p.cohort===cohortFilter))).filter(p=>(p.name+' '+p.site).toLocaleLowerCase().includes(query.toLocaleLowerCase())&&(status==='all'||band(p.rate)===status)).sort((a,b)=>{if(sort==='name')return a.name.localeCompare(b.name,'ja');if(sort==='total')return b.total-a.total;if(sort==='latest')return b.last-a.last;if(a.rate===null||b.rate===null)return a.rate===b.rate?0:a.rate===null?1:-1;return sort==='high'?b.rate-a.rate:a.rate-b.rate;});
   const pages=Math.max(1,Math.ceil(filtered.length/8));page=Math.min(page,pages-1);q('[data-sb-count]').textContent=filtered.length+'人';
   q('[data-sb-list]').innerHTML=filtered.slice(page*8,page*8+8).map(p=>'<button type="button" class="sb-person sb-'+band(p.rate)+'" data-sb-person="'+esc(p.key)+'"><span class="sb-avatar" aria-hidden="true">'+esc(Array.from(p.name)[0]||'人')+'</span><span class="sb-person-main"><b>'+esc(p.name)+'</b><small>'+esc(p.site)+(getData()?.annual?' · '+esc(cohortLabel[p.cohort]):'')+' · '+p.total.toLocaleString('ja-JP')+'問</small><span class="sb-badge">'+(p.excluded?'集計対象外':label(p.rate))+'</span></span><span class="sb-person-rate">'+pct(p.rate)+'<small>'+stamp(p.last)+'</small></span><span class="sb-chevron" aria-hidden="true">›</span></button>').join('')||'<p class="sb-empty">該当する登録者はいません。</p>';
   q('[data-sb-page]').textContent=(page+1)+' / '+pages;q('[data-sb-prev]').disabled=page===0;q('[data-sb-next]').disabled=page>=pages-1;
   host.querySelectorAll('[data-sb-person]').forEach(b=>b.onclick=()=>openPerson(all.find(p=>p.key===b.dataset.sbPerson)));
  }
  function draw(){
   if(!host.isConnected)return;const data=getData()||{};
   if(!data.authenticated){exclusions.hidden=true;exclusions.querySelector('input').checked=false;document.querySelectorAll('.sb-dialog').forEach(d=>d.close());all=[];cohortSummary.textContent='';cohorts.hidden=true;q('[data-sb-source]').textContent=data.pendingExclusions?'成績と除外設定を読み込み中です。表示されない場合は通信を確認して更新してください。':'ログインすると成績を表示します。';q('[data-sb-stats]').replaceChildren();q('[data-sb-chart]').innerHTML=chart([],'正答率の推移');q('[data-sb-daily]').replaceChildren();q('[data-sb-trend-rate]').textContent='';list();return;}
   cohorts.hidden=!data.annual;cohortSummary.hidden=!data.annual;exclusions.hidden=!data.manageExclusions;if(!data.manageExclusions)exclusions.querySelector('input').checked=false;const locked=data.scope||'';if(locked!==lastScope){site=locked;lastScope=locked;page=0;}
   const options=[...new Set([...(data.roster||[]).map(p=>p.site),...(data.rows||[]).map(r=>r.site)])].filter(Boolean).sort((a,b)=>a.localeCompare(b,'ja'));
   q('[data-sb-site]').innerHTML=(locked?'':'<option value="">全拠点</option>')+options.filter(s=>!locked||s===locked).map(s=>'<option value="'+esc(s)+'">'+esc(s)+'</option>').join('');
   if(locked&&!options.includes(locked))q('[data-sb-site]').innerHTML='<option>'+esc(locked)+'</option>';
   if(!locked&&site&&!options.includes(site))site='';q('[data-sb-site]').value=site;q('[data-sb-site]').disabled=!!locked;
   all=people(data,grade,site,mode);cohortSummary.textContent=Object.entries(cohortLabel).map(([key,label])=>label+' '+all.filter(p=>!p.excluded&&p.cohort===key).length+'人').join(' ／ ');if(!data.manageExclusions)all=all.filter(p=>!p.excluded);const stats=aggregate(all),known=Array.isArray(data.roster),points=series(all,mode,days);
   q('[data-sb-source]').textContent=(!known?'登録者一覧を取得できていないため、成績のある人を表示しています。':(site||'全拠点')+' · '+grade+'級 · '+(mode==='academic'?'学科':mode==='practical'?'実技':'総合'));
   q('[data-sb-stats]').innerHTML='<div class="sb-stat"><span>'+ (data.annual?'今年の'+grade+'級受講者':known?'登録者':'成績取得者')+'</span><strong>'+stats.registered+'<small>人</small></strong><p>学習済み '+stats.learned+'人</p></div><div class="sb-stat sb-average"><span>平均正答率</span><strong>'+pct(stats.rate)+'</strong><p>正解数 ÷ 回答数</p></div><div class="sb-stat sb-achieved"><span>85%以上</span><strong>'+stats.good+'<small>人</small></strong><p>目標合格ライン到達</p></div><div class="sb-stat sb-attention"><span>75%未満</span><strong>'+stats.low+'<small>人</small></strong><p>重点フォロー</p></div>';
   q('[data-sb-trend-rate]').textContent=pct(stats.rate);q('[data-sb-chart]').innerHTML=chart(points,'全員の正答率推移');
   q('[data-sb-daily]').innerHTML='<table><thead><tr><th>日付</th><th>正答率</th><th>回答数</th></tr></thead><tbody>'+points.slice().reverse().map(p=>'<tr><td>'+p.day+'</td><td>'+pct(p.rate)+'</td><td>'+p.total.toLocaleString('ja-JP')+'問</td></tr>').join('')+'</tbody></table>';list();
  }
  function openPerson(p){
   if(!p)return;const opener=document.activeElement,d=document.createElement('dialog');d.className='sb-dialog';const points=series([{...p,excluded:false,target:true}],mode,days);
   d.innerHTML='<header><div><small>'+esc(p.site)+' · '+grade+'級</small><h2>'+esc(p.name)+'</h2></div><button type="button" aria-label="閉じる">×</button></header><div class="sb-detail-body"><div class="sb-detail-score sb-'+band(p.rate)+'"><span>'+label(p.rate)+'</span><strong>'+pct(p.rate)+'</strong><p>'+p.correct.toLocaleString('ja-JP')+'正解 / '+p.total.toLocaleString('ja-JP')+'問</p></div><h3>個人の正答率推移</h3>'+chart(points,p.name+'さんの正答率推移')+'<details class="sb-daily"><summary>日別データを確認</summary><div><table><thead><tr><th>日付</th><th>正答率</th><th>回答数</th></tr></thead><tbody>'+points.slice().reverse().map(x=>'<tr><td>'+x.day+'</td><td>'+pct(x.rate)+'</td><td>'+x.total.toLocaleString('ja-JP')+'問</td></tr>').join('')+'</tbody></table></div></details><p class="sb-note">最終更新 '+stamp(p.last)+'</p></div>';
   const source=getData()||{};if(source.manageExclusions&&typeof source.setExcluded==='function'){
    const actions=document.createElement('div');actions.className='sb-exclusion-actions';actions.innerHTML='<p>除外するとマネージャーには非表示になり、人数・平均・全体グラフにも含まれません。本人の学習記録とプレイヤー画面の分析は残ります。</p><button type="button" data-sb-toggle-exclusion></button><p role="status"></p>';const button=actions.querySelector('button');button.textContent=p.excluded?'集計対象に戻す':'このメンバーを集計から除外';button.onclick=async()=>{if(!getData()?.manageExclusions)return;const value=!p.excluded;if(!confirm(p.name+'さんを'+(value?'集計から除外しますか？':'集計対象に戻しますか？')+'\\n学科・実技、1・2級共通で反映されます。学習記録は削除しません。'))return;button.disabled=true;actions.querySelector('[role="status"]').textContent='保存中…';try{await source.setExcluded(p.key,value);d.close();draw();}catch{button.disabled=false;actions.querySelector('[role="status"]').textContent='保存できませんでした。通信とログインを確認して再試行してください。';}};d.querySelector('.sb-detail-body').append(actions);
   }document.body.append(d);d.querySelector('button').onclick=()=>d.close();d.addEventListener('close',()=>{d.remove();if(opener?.isConnected)opener.focus({preventScroll:true});});d.addEventListener('click',e=>{if(e.target!==d)return;const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();});d.showModal();
  }
  q('[data-sb-grade]').onchange=e=>{grade=+e.target.value;page=0;draw();};q('[data-sb-site]').onchange=e=>{site=e.target.value;page=0;draw();};q('[data-sb-days]').onchange=e=>{days=+e.target.value;draw();};
  q('[data-sb-query]').oninput=e=>{query=e.target.value;page=0;list();};q('[data-sb-sort]').onchange=e=>{sort=e.target.value;page=0;list();};q('[data-sb-prev]').onclick=()=>{page--;list();};q('[data-sb-next]').onclick=()=>{page++;list();};
  host.querySelectorAll('[data-sb-mode]').forEach(b=>b.onclick=()=>{mode=b.dataset.sbMode;page=0;host.querySelectorAll('[data-sb-mode]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));draw();});
  host.querySelectorAll('[data-sb-status]').forEach(b=>b.onclick=()=>{status=b.dataset.sbStatus;page=0;host.querySelectorAll('[data-sb-status]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));list();});
  document.addEventListener('skimaru-score-data',draw);draw();return {refresh:draw};
 }
 window.SKIMARU_SCOREBOARD={mount,people,aggregate,series,chart,measure,band};
})();
