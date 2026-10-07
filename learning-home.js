"use strict";
// One dashboard for both grades. All progress is derived from existing records.
(() => {
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let achievements=[],opener;
 function catalog(s){return [
  ['◉','保全、始動。','学科または実技を1問解く',s.academicTotal+s.practicalTotal>=1],
  ['◇','すきまの積み重ね','学科を100問解く',s.academicTotal>=100],
  ['⌁','コツコツ整備士','学科を500問解く',s.academicTotal>=500],
  ['∞','千問の向こう側','学科を1,000問解く',s.academicTotal>=1000],
  ['☀','七日目の習慣','7日連続で学習する',s.streak>=7],
  ['◎','合格圏へ、点検完了','年度別の学科過去問で80%以上',s.bestPast!=null&&s.bestPast>=80],
  ['↗','昨日の自分を超える','同じ年度の学科過去問で前回比10ポイント以上向上',s.improvement!=null&&s.improvement>=10],
  ['⚒','現場の頼れる一手','実技を20問以上解いて累計正答率80%以上',s.practicalTotal>=20&&s.practicalRate>=80]
 ].map(([icon,name,condition,unlocked])=>({icon,name,condition,unlocked}));}
 function html(s,date,record={},persist=()=>{}){
  record.achievements||={};let changed=false;
  achievements=catalog(s).map((a,i)=>{const key='learning-v165-'+i;if(a.unlocked&&!record.achievements[key]){record.achievements[key]=true;changed=true;}return {...a,unlocked:a.unlocked||record.achievements[key]===true};});if(changed)persist();const n=achievements.filter(x=>x.unlocked).length;
  const days=window.SKIMARU_COACH.daysUntil(date),c=window.SKIMARU_COACH.coachMessage(s);
  const big=days==null?'未設定':days<0?'終了':days===0?'本日':`あと ${days}日`;
  const sub=days==null?'歯車で試験日を設定':days<0?'試験日を過ぎています':days<=7?'仕上げ期間です':'毎日少しずつ積み上げよう';
  return `<section class="learning-dashboard" aria-label="学習の概要"><div class="learning-dashboard-top"><div class="learning-exam"><span>EXAM</span><b>${big}</b><small>${sub}</small></div><div class="learning-coach"><span>今日のコーチ</span><h3>${esc(c.title)}</h3><p>${esc(c.action)}</p></div></div><div class="learning-metrics"><div><span>過去問ベスト</span><b>${s.bestPast==null?'—':s.bestPast+'%'}</b></div><div><span>実技正答率</span><b>${s.practicalRate==null?'—':s.practicalRate+'%'}</b></div><div><span>学科回答</span><b>${s.academicTotal}問</b></div></div><button class="learning-achievements" type="button" data-achievements><span>◇ 実績</span><small>${n} / ${achievements.length} 解放</small><span aria-hidden="true">→</span></button></section>`;
 }
 function open(){
  document.getElementById('learning-achievement-dialog')?.remove();
  const d=document.createElement('dialog');d.id='learning-achievement-dialog';d.className='learning-achievement-dialog';
  d.innerHTML=`<div class="learning-dialog-head"><h2>あなたの実績</h2><button type="button" data-close aria-label="実績を閉じる">×</button></div><p class="learning-dialog-hint">タップすると解放条件が見られます。</p><div class="learning-achievement-list">${achievements.map(a=>`<details><summary><span aria-hidden="true">${a.unlocked?a.icon:'◇'}</span><b>${esc(a.name)}</b><small>${a.unlocked?'解放済み':'未解放'}</small></summary><p>${esc(a.condition)}</p><p class="learning-achievement-state">${a.unlocked?'達成しています。':'学習を続けて解放しよう。'}</p></details>`).join('')}</div>`;
  document.body.append(d);d.querySelector('[data-close]').onclick=()=>d.close();d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}});d.addEventListener('close',()=>{opener?.focus();d.remove();});d.showModal();
 }
 document.addEventListener('click',e=>{const b=e.target.closest('[data-achievements]');if(b){opener=b;open();}});
 window.SKIMARU_LEARNING_HOME={html};
})();
