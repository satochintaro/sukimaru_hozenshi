"use strict";
(()=>{
 const SITES=['全体','四日市','石岡','足利','水戸','真岡','門真','北九州'];
 const COLORS=['#173f36','#277ac7','#b55a18','#7a4cc0','#aa315f','#087b86','#687b22','#735443'];
 let generation=0;
 const num=n=>Number(n||0).toLocaleString('ja-JP');
 const rate=n=>n==null?'—':`${Number(n).toFixed(1)}%`;
 function clear(){generation++;document.getElementById('site-comparison')?.remove();}
 async function load(rpc,token,isCurrent){
  const revision=++generation;
  let data;
  try{data=await rpc('skimaru_manager_comparison_history',{p_token:token});}
  catch(e){if(revision!==generation||!isCurrent())return;let root=mount();root.textContent='拠点比較を取得できませんでした。右上の更新ボタンで再読み込みしてください。';return;}
  if(revision!==generation||!isCurrent())return;
  const root=mount();root.innerHTML=`<h2>全体・拠点比較</h2><p class="comparison-note">他拠点も集計成績を共有。個人名は表示しません。</p><div class="comparison-controls"><label>区分<select data-kind><option value="combined">総合</option><option value="academic">学科</option><option value="practical">実技</option></select></label><label>期間<select data-days><option value="30">30日間</option><option value="7">7日間</option><option value="90">90日間</option></select></label></div><div class="comparison-cards"></div><h3>正答率の推移</h3><div class="comparison-legend" aria-label="表示する拠点"></div><div class="comparison-chart"></div><p class="comparison-note">日付は日本時間。提出を受け取った時点で反映し、未提出の日は直前の記録を引き継ぎます。</p><h3>拠点ごとの比較</h3><div class="comparison-table-wrap"><table class="comparison-table"><caption></caption><thead><tr><th scope="col">拠点</th><th scope="col">人数</th><th scope="col">正答率</th><th scope="col">変化</th><th scope="col">回答数</th><th scope="col">記録学習時間</th></tr></thead><tbody></tbody></table></div><details><summary>日ごとの数値を見る</summary><div class="comparison-table-wrap"><table class="comparison-daily"><thead><tr><th>日付</th><th>拠点</th><th>正答率</th><th>回答数</th></tr></thead><tbody></tbody></table></div></details><p class="comparison-note comparison-updated"></p><p class="comparison-note">正答率＝総正解数÷総回答数。各人の学科・実技の最新提出を集計します。変化は期間初日との差（ポイント）。未提出は「—」、人数は提出者数です。学習時間はアプリが記録した時間です。</p>`;
  const visible=new Set(SITES);
  SITES.forEach((site,i)=>{const label=document.createElement('label');label.style.color=COLORS[i];const checkbox=document.createElement('input');checkbox.type='checkbox';checkbox.checked=true;checkbox.addEventListener('change',()=>{checkbox.checked?visible.add(site):visible.delete(site);draw();});label.append(checkbox,document.createTextNode(site));root.querySelector('.comparison-legend').append(label);});
  root.querySelectorAll('select').forEach(el=>el.addEventListener('change',draw));
  root.querySelector('.comparison-updated').textContent=`集計更新：${new Date(data.generated_at).toLocaleString('ja-JP',{timeZone:'Asia/Tokyo'})}`;
  function draw(){
   const type=root.querySelector('[data-kind]').value,days=+root.querySelector('[data-days]').value;
   const end=new Date(data.today+'T00:00:00Z'),dates=Array.from({length:days},(_,i)=>new Date(end.getTime()-(days-1-i)*86400000).toISOString().slice(0,10));
   const points=(data.points||[]).filter(p=>p.type===type&&p.day>=dates[0]&&p.day<=data.today);
   const lookup=new Map(points.map(p=>[p.day+'|'+p.site,p]));
   const current=site=>lookup.get(data.today+'|'+site);
   const total=current('全体');
   const cards=root.querySelector('.comparison-cards');cards.replaceChildren();
   [['全体の正答率',rate(total?.accuracy)],['総回答数',total?num(total.answers)+'問':'—'],['提出者数',total?num(total.learners)+'人':'—']].forEach(([label,value])=>{const el=document.createElement('div');const small=document.createElement('small'),b=document.createElement('b');small.textContent=label;b.textContent=value;el.append(small,b);cards.append(el);});
   const tbody=root.querySelector('.comparison-table tbody');tbody.replaceChildren();
   SITES.forEach(site=>{const p=current(site),first=lookup.get(dates[0]+'|'+site),diff=p?.accuracy!=null&&first?.accuracy!=null?Number(p.accuracy)-Number(first.accuracy):null;const row=tbody.insertRow();[site,p?num(p.learners):'—',rate(p?.accuracy),diff==null?'—':`${diff>0?'+':''}${diff.toFixed(1)}pt`,p?num(p.answers):'—',p?num(Math.round(p.seconds/60))+'分':'—'].forEach(text=>row.insertCell().textContent=text);if(site==='全体')row.className='comparison-total';});
   root.querySelector('caption').textContent=`${data.today}時点の最新提出・${days}日間の変化`;
   const daily=root.querySelector('.comparison-daily tbody');daily.replaceChildren();points.filter(p=>visible.has(p.site)).sort((a,b)=>b.day.localeCompare(a.day)||SITES.indexOf(a.site)-SITES.indexOf(b.site)).forEach(p=>{const row=daily.insertRow();[p.day,p.site,rate(p.accuracy),num(p.answers)].forEach(text=>row.insertCell().textContent=text);});
   const host=root.querySelector('.comparison-chart');host.replaceChildren();
   const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 420 240');svg.setAttribute('role','img');svg.setAttribute('aria-label',`${days}日間の拠点別正答率。下の日ごとの数値でも確認できます。`);
   const node=(tag,attrs,text)=>{const e=document.createElementNS(ns,tag);Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,v));if(text)e.textContent=text;svg.append(e);return e;};
   [0,25,50,75,100].forEach(n=>{const y=200-n*1.65;node('line',{x1:42,x2:408,y1:y,y2:y,stroke:'#d8e1dc'});node('text',{x:35,y:y+4,'text-anchor':'end',fill:'#53675f','font-size':14},n+'%');});
   [0,Math.floor((days-1)/2),days-1].forEach(i=>node('text',{x:42+366*i/(days-1),y:226,'text-anchor':i===0?'start':i===days-1?'end':'middle',fill:'#53675f','font-size':14},dates[i].slice(5).replace('-','/')));
   let plotted=false;
   SITES.forEach((site,index)=>{if(!visible.has(site))return;let segment=[];const flush=()=>{if(segment.length>1)node('polyline',{points:segment.map(p=>p.join(',')).join(' '),fill:'none',stroke:COLORS[index],'stroke-width':site==='全体'?4:2,'stroke-linejoin':'round'});segment=[];};dates.forEach((day,i)=>{const p=lookup.get(day+'|'+site);if(p?.accuracy==null){flush();return;}plotted=true;const x=42+366*i/(days-1),y=200-Number(p.accuracy)*1.65;segment.push([x,y]);if(i===days-1||days===7){const circle=node('circle',{cx:x,cy:y,r:site==='全体'?4:2.5,fill:COLORS[index]});const title=document.createElementNS(ns,'title');title.textContent=`${day} ${site} ${rate(p.accuracy)}`;circle.append(title);}});flush();});
   host.append(svg);if(!plotted){const p=document.createElement('p');p.textContent=visible.size?'この期間の提出データはありません。':'表示する拠点を選んでください。';host.append(p);}
  }
  draw();
 }
 function mount(){let root=document.getElementById('site-comparison');if(!root){root=document.createElement('div');root.id='site-comparison';root.className='site-comparison pn';document.getElementById('viewer-report').before(root);}return root;}
 window.SKIMARU_COMPARISON={load,clear};
})();
