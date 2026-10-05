'use strict';
(()=>{
 const y=Number(document.body.dataset.year); if(![2022,2023].includes(y)||document.body.dataset.kind!=='jitugi')return;
 const data=window.SKIMARU_EARLY_OFFICIAL?.[y]; if(!data)return;
 const host=document.getElementById('questions'), source=document.getElementById('source'); if(!host||!source)return;
 const card=host.closest('.card'), key=`skimaruEarly_${y}_jitugi_v1`; let current=1;
 const panel=document.createElement('div'); panel.className='pv-panel';
 panel.innerHTML='<div class="pv-head"><b id="pvNo"></b><span id="pvTask"></span></div><div id="pvContext" class="pv-context"></div><div class="pv-figure"><div class="pv-label">原本の該当箇所 <span>タップで原本全体</span></div><div id="pvWindow" class="pv-window" role="button" tabindex="0"><img id="pvImg" alt=""></div></div><button id="pvSource" class="pv-source" type="button">原本を見る</button>';
 card.insertBefore(panel,host);
 const nav=document.createElement('div'); nav.className='pv-nav'; nav.innerHTML='<button id="pvPrev">← 前へ</button><span id="pvPos" class="pv-pos"></span><button id="pvNext">次へ →</button>'; card.insertBefore(nav,document.getElementById('nav'));
 const h3=card.querySelector('h3'), muted=card.querySelector('.muted'); if(h3)h3.style.display='none'; if(muted)muted.style.display='none';
 function state(){try{return JSON.parse(localStorage.getItem(key)||'null')||{answers:{}}}catch{return{answers:{}}}}
 function taskIndexFor(n){return data.tasks.findIndex(t=>n>=t.start&&n<=t.end)}
 function taskFor(n){return data.tasks[taskIndexFor(n)]}
 function pageFor(n){const t=taskFor(n); if(!t)return 2; const pages=t.branch?(t.branch.A||t.pages):t.pages; if(pages.length===1)return pages[0]; const span=t.end-t.start+1, rel=n-t.start; return pages[Math.min(pages.length-1,Math.floor(rel/(span/pages.length)))]}
 function openOriginal(){const imgs=[...source.querySelectorAll('img')]; const p=pageFor(current); const img=imgs.find(x=>x.src.includes(`_p${p}.jpg`))||imgs[0]; if(img)img.click()}
 function sync(block,n){const saved=state().answers?.[n]; for(const b of block.querySelectorAll('.options button')){b.classList.toggle('chosen',b.textContent.trim()===saved);b.setAttribute('aria-pressed',String(b.textContent.trim()===saved))}}
 function render(){
   const t=taskFor(current); if(!t)return; const blocks=[...host.querySelectorAll('.q')];
   blocks.forEach((b,i)=>{const n=t.start+i;b.hidden=n!==current;sync(b,n)});
   host.classList.add('pv-mode'); source.classList.add('pv-hidden'); document.getElementById('nav').classList.add('pv-hidden');
   const p=pageFor(current); document.getElementById('pvNo').textContent=`問題 ${current}`; document.getElementById('pvTask').textContent=`課題${taskIndexFor(current)+1}`;
   document.getElementById('pvContext').textContent=`${t.title}　問題${current}。下の原本該当箇所を確認して解答してください。`;
   const img=document.getElementById('pvImg'); img.src=`./original_${y}_jitugi_p${p}.jpg`;
   // Generic safe viewport: keep original untouched and show a readable central enlargement.
   // Per-question offsets can be tuned later without replacing image files.
   img.style.width='150%'; img.style.left='-25%'; img.style.top='-8%';
   document.getElementById('pvPos').textContent=`${current} / ${y===2022?76:78}`;
   document.getElementById('pvPrev').disabled=current===1;
   document.getElementById('pvNext').textContent=current===(y===2022?76:78)?'解答状況を確認':'次へ →';
 }
 document.getElementById('pvSource').onclick=openOriginal; document.getElementById('pvWindow').onclick=openOriginal;
 document.getElementById('pvPrev').onclick=()=>{if(current>1){current--; const ti=taskIndexFor(current); document.querySelectorAll('#tabs button')[ti]?.click(); setTimeout(render,0)}};
 document.getElementById('pvNext').onclick=()=>{const total=y===2022?76:78;if(current<total){current++;const ti=taskIndexFor(current);document.querySelectorAll('#tabs button')[ti]?.click();setTimeout(render,0)}else document.getElementById('next')?.click()};
 host.addEventListener('click',e=>{const b=e.target.closest('.options button');if(!b)return;setTimeout(()=>sync(b.closest('.q'),current),0)});
 const mo=new MutationObserver(()=>setTimeout(()=>{const t=taskFor(current);if(t)render()},0));mo.observe(host,{childList:true});
 // start from first unanswered
 const s=state(); const total=y===2022?76:78; current=1; while(current<=total&&s.answers?.[current])current++; if(current>total)current=total;
 const ti=taskIndexFor(current); document.querySelectorAll('#tabs button')[ti]?.click(); setTimeout(render,0);
})();