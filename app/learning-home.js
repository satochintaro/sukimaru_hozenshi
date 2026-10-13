"use strict";
// One dashboard for both grades. All progress is derived from existing records.
(() => {
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let achievements=[],opener;
 let career;
 const {rank,catalog}=window.SKIMARU_ACHIEVEMENTS;
 function html(s,date,record={},persist=()=>{},mode='academic'){
  career=rank(s);record.achievements||={};let changed=false;
  const currentRank=['未覚醒','覚醒者','探究者','超越者','到達者'].indexOf(career[0]);if(currentRank>(record.learningRank||0)){record.learningRank=currentRank;changed=true;}if((record.learningRank||0)>currentRank)career=[['未覚醒','覚醒者','探究者','超越者','到達者'][record.learningRank],'これまでの学習で到達したランクです。'];
  achievements=catalog(s).map((a,i)=>{const key='learning-v165-'+i;if(a.unlocked&&!record.achievements[key]){record.achievements[key]=true;changed=true;}return {...a,unlocked:a.unlocked||record.achievements[key]===true};});if(changed)persist();const n=achievements.filter(x=>x.unlocked).length;
  const days=window.SKIMARU_COACH.daysUntil(date),c=window.SKIMARU_COACH.coachMessage(s);
  const big=days==null?'未設定':days<0?'終了':days===0?'本日':`あと ${days}日`;
  const sub=days==null?'':days<0?'試験日を過ぎています':days<=7?'仕上げ期間です':'毎日少しずつ積み上げよう';
  const practical=mode==='practical', rate=practical?s.practicalRate:s.academicRate??(s.academicTotal?Math.round((s.academicCorrect||0)/s.academicTotal*100):null);
  const sdGrade=document.body.classList.contains('grade1-app')?1:2,sdUnlocked=window.SKIMARU_LIMIT_UNLOCK.observe(record,sdGrade,persist),sdActive=['question','correct'].includes(record.suddenDeath?.current?.phase);
  const sdEntry=practical?'':window.SKIMARU_LIMIT_CARD.html(sdGrade,sdUnlocked,sdActive,record.suddenDeath?.best);

  const history=(practical?s.practicalYearHistory:s.yearHistory)||[],best=practical?window.SKIMARU_COACH.bestPastScore(history):s.bestPast;
  const icon=name=>window.SKIMARU_ICONS?.svg(name)||'';
  const metrics=`<div class="learning-metrics"><div><span>${icon('target')}正答率</span><b>${rate==null?'—':rate+'%'}</b></div><div><span>${icon('file')}回答数</span><b>${practical?s.practicalTotal:s.academicTotal}<small>問</small></b></div><div><span>${icon('calendar')}連続学習</span><b>${s.streak||0}<small>日</small></b></div></div>`;
  return `<div class="learning-dashboard" role="region" aria-label="学習の概要"><div class="learning-dashboard-top"><div class="learning-exam">${icon('calendar')}<div><span>試験まで</span><b>${big}</b><small>${sub}</small></div></div><div class="learning-coach"><span>今日のコーチ</span><h3>${esc(c.title)}</h3><p>${esc(c.action)}</p></div></div>${metrics}<button class="learning-achievements" type="button" data-achievements><span>${icon('diamond')}${esc(career[0])}</span><small>${n} / ${achievements.length} 解放</small>${icon('arrow')}</button>${sdEntry}<p class="learning-past-best">${practical?'実技':'学科'}過去問ベスト <b>${best==null?'—':best+'%'}</b></p></div>`;

 }
 function open(){
  document.getElementById('learning-achievement-dialog')?.remove();
  const d=document.createElement('dialog');d.id='learning-achievement-dialog';d.className='learning-achievement-dialog';
  d.innerHTML=`<div class="learning-dialog-head"><h2>あなたの実績</h2><button type="button" data-close aria-label="実績を閉じる">×</button></div><p class="learning-rank-title">${esc(career[0])}</p><p class="learning-dialog-hint">${esc(career[1])}</p><p class="learning-dialog-hint">実績をタップすると解放条件が見られます。固有スキル風の称号は、このアプリ独自の名称です。学習時間は実際に計測した時間のみです。</p><div class="learning-achievement-list">${achievements.map(a=>`<details><summary><span aria-hidden="true">${a.unlocked?a.icon:'◇'}</span><b>${esc(a.name)}</b><small>${a.unlocked?'解放済み':'未解放'}</small></summary><p>${esc(a.condition)}</p><p class="learning-achievement-state">${a.unlocked?'達成しています。':'学習を続けて解放しよう。'}</p></details>`).join('')}</div>`;
  document.body.append(d);d.querySelector('[data-close]').onclick=()=>d.close();d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}});d.addEventListener('close',()=>{opener?.focus();d.remove();});d.showModal();
 }
 document.addEventListener('click',e=>{const b=e.target.closest('[data-achievements]');if(b){opener=b;open();}});
 window.SKIMARU_LEARNING_HOME={html};
})();

/* One navigation layout for both grades. Reordering preserves event handlers. */
(()=>{
 function normalize(){
  const host=document.querySelector('#sc-home.active .player-home-pad')||document.querySelector('#main #sc-home .player-home-pad')||document.querySelector('#pt-home.active .practical-pad')||document.querySelector('#main > .pad.years');
  document.body?.classList.toggle('unified-home-view',!!host);
  if(!host)return;
  host.classList.add('unified-home');
  const intro=host.querySelector('.g1-intro,.player-menu-head,.pt-hero'),menu=host.querySelector('.player-main-menu');
  if(!intro||!menu)return;
  const practical=menu.classList.contains('practical-tools-menu');
  if(practical){const p=intro.querySelector('p');if(p&&p.textContent!=='全課題でも、課題ごとでも学習できます。')p.textContent='全課題でも、課題ごとでも学習できます。';}
  const rank=['科目別演習','年度別過去問','復習モード','重点マーク','学習分析','成績報告'];
  const action=name=>document.body.classList.contains('grade1-app')?window.SKIMARU_HOME_ACTION?.(name):practical?window.SKIMARU_PRACTICAL_HOME?.(name):window.startQuick?.();
  if(practical)for(const [name,label] of [['subjects','科目別演習'],['years','年度別過去問']]){
   if(!menu.querySelector('[data-home-action="'+name+'"]')){const b=document.createElement('button');b.className='mi';b.dataset.homeAction=name;b.innerHTML='<span class="mi-i"></span><span class="mi-n">'+label+'</span>';b.onclick=()=>action(name);menu.append(b);}
  }
  let quick=host.querySelector('.shared-quick');
  if(!quick){quick=document.createElement('div');quick.className='quick-card shared-quick';quick.innerHTML='<div class="quick-eyebrow">TODAY’S CHALLENGE <span>5 QUESTIONS</span></div><span class="quick-book-art" aria-hidden="true">'+(window.SKIMARU_ICONS?.svg('book')||'')+'</span><h2>今日の5問</h2><p>5問から、保全力を伸ばそう。</p><button type="button">5問に挑戦する <span aria-hidden="true">→</span></button><div class="quick-goal"><span>今日の目標</span><b data-daily-count>0 / 5問</b></div><div class="quick-track"><i></i></div>';quick.querySelector('button').onclick=()=>action('random');host.append(quick);}
  const profile=(()=>{try{return JSON.parse(localStorage.getItem(document.body.classList.contains('grade1-app')?'skimaru-grade1-v16':'skimaruData')||'{}');}catch{return {};}})(),now=new Date(),date=new Date(now.getTime()+9*3600000).toISOString().slice(0,10);
  let daily=Number(profile.daily?.[date])||0;
  if(practical&&!document.body.classList.contains('grade1-app')){try{const hs=JSON.parse(localStorage.getItem('skimaruExamHistory_v1')||'[]');daily=hs.filter(h=>h.kind==='jitugi'&&h.completedAt&&new Date(new Date(h.completedAt).getTime()+9*3600000).toISOString().slice(0,10)===date).reduce((n,h)=>n+(Number(h.total)||0),0);}catch{}}
  const goal=quick.querySelector('[data-daily-count]'),goalText=Math.min(daily,5)+' / 5問';if(goal&&goal.textContent!==goalText)goal.textContent=goalText;const track=quick.querySelector('.quick-track i'),width=Math.min(daily,5)*20+'%';if(track&&track.style.width!==width)track.style.width=width;
  const items=[...menu.children].filter(e=>e.classList.contains('mi'));
  const order=e=>{const label=(e.querySelector('.mi-n')?.textContent||'').replace(/\s/g,'').replace('提出','報告'),index=rank.indexOf(label);return index<0?99:index;};
  items.sort((a,b)=>order(a)-order(b));
  items.forEach((e,i)=>{if(menu.children[i]!==e)menu.insertBefore(e,menu.children[i]||null);const label=e.querySelector('.mi-n');if(label?.querySelector('br'))label.textContent=label.textContent;const badge=e.querySelector('.mi-i');const iconNames=['book','file','repeat','focus','chart','clipboard'],iconName=iconNames[order(e)]||iconNames[i]||'book';if(badge&&badge.dataset.iconName!==iconName){badge.dataset.iconName=iconName;badge.innerHTML=window.SKIMARU_ICONS?.svg(iconName)||String(i+1).padStart(2,'0');}if(label&&/成績.*提出/.test(label.textContent))label.textContent='成績報告';if(label&&order(e)===5&&!e.querySelector('.menu-optional')){const sub=document.createElement('small');sub.className='menu-optional';sub.textContent='完了報告は任意';e.append(sub);}});
  let footer=host.querySelector('.learning-footer');
  if(!footer){footer=document.createElement('footer');footer.className='learning-footer';const grade1=document.body.classList.contains('grade1-app');footer.innerHTML='<a class="learning-grade-switch" href="../index.html#grades">級を選び直す →</a><details class="learning-contact"><summary>お知らせ・お問い合わせ</summary><div data-support-host></div></details>';host.append(footer);}
  const contact=footer.querySelector('[data-support-host]');
  host.querySelectorAll('.support-launchers').forEach(nav=>{if(nav.parentElement!==contact)contact.append(nav);});
  host.querySelectorAll('.rollout-tools').forEach(e=>e.remove());
  host.querySelectorAll('a').forEach(a=>{if(a!==footer.querySelector('a')&&/切り替え|マネージャーとして/.test(a.textContent))a.remove();});
  host.querySelectorAll(':scope > p.note').forEach(p=>{if(/課題・問題番号で移動/.test(p.textContent))p.remove();});
  const status=host.querySelector('.member-bar');if(status&&status.nextElementSibling!==footer)footer.before(status);
  if(host.lastElementChild!==footer)host.append(footer);
  const leading=[host.querySelector('.learning-mode-switch'),quick,host.querySelector('#coach-dashboard,#coach-practical-summary')||host.querySelector('.learning-dashboard'),menu].filter(Boolean);
  leading.forEach((e,i)=>{if(host.children[i]!==e)host.insertBefore(e,host.children[i]||null);});
 }
 let scheduled=false;
 new MutationObserver(()=>{if(!scheduled){scheduled=true;requestAnimationFrame(()=>{scheduled=false;normalize();});}}).observe(document.documentElement,{childList:true,subtree:true});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',normalize);else normalize();
})();
