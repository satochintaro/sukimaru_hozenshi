"use strict";
// One dashboard for both grades. All progress is derived from existing records.
(() => {
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let achievements=[],opener;
 let career;
 function rank(s){const total=s.careerTotal??s.academicTotal+s.practicalTotal,coverage=s.academicPool?Math.min(1,(s.academicSeen||0)/s.academicPool):0;if(total>=3000&&coverage>=.9&&(s.careerRate||0)>=85&&(s.studySeconds||0)>=36000)return ['到達者','科目別学科の9割以上を経験し、学習量・精度・時間を積み重ねた到達者'];if(total>=1000)return ['超越者','数多くの問題を経験し、保全力を磨き続けるプレイヤー'];if(total>=100)return ['探究者','学習の習慣が育ち、知識の幅を広げているプレイヤー'];if(total>0)return ['覚醒者','保全の世界で、最初の一歩を踏み出したプレイヤー'];return ['未覚醒','まだ学習を始めていないプレイヤー'];}
 function catalog(s){return [
  ['◉','保全、始動。','学科または実技を1問解く',s.academicTotal+s.practicalTotal>=1],
  ['◇','すきまの積み重ね','学科を100問解く',s.academicTotal>=100],
  ['⌁','コツコツ整備士','学科を500問解く',s.academicTotal>=500],
  ['∞','千問の向こう側','学科を1,000問解く',s.academicTotal>=1000],
  ['☀','七日目の習慣','7日連続で学習する',s.streak>=7],
  ['◎','合格圏へ、点検完了','年度別の学科過去問で80%以上',s.bestPast!=null&&s.bestPast>=80],
  ['↗','昨日の自分を超える','同じ年度の学科過去問で前回比10ポイント以上向上',s.improvement!=null&&s.improvement>=10],
  ['⚒','現場の頼れる一手','実技を20問以上解いて累計正答率80%以上',s.practicalTotal>=20&&s.practicalRate>=80],
  ['✦','叡智の眼','累計1,500問に回答し、記録された実学習時間5時間を達成',s.careerTotal>=1500&&s.studySeconds>=18000],
  ['⌛','無限書庫','累計3,000問に回答し、記録された実学習時間15時間を達成',s.careerTotal>=3000&&s.studySeconds>=54000],
  ['✧','万象解読','科目別学科の90%以上に回答し、累計正答率85%以上・累計3,000問・実学習時間10時間を達成',s.academicPool>0&&s.academicSeen/s.academicPool>=.9&&s.careerRate>=85&&s.careerTotal>=3000&&s.studySeconds>=36000],
  ['♜','不屈の魂','累計5,000問に回答し、記録された実学習時間20時間を達成',s.careerTotal>=5000&&s.studySeconds>=72000],
  ['✵','真理掌握','累計10,000問・実学習時間30時間・累計正答率90%以上・科目別学科の95%以上に回答を達成',s.careerTotal>=10000&&s.studySeconds>=108000&&s.careerRate>=90&&s.academicPool>0&&s.academicSeen/s.academicPool>=.95]
 ].map(([icon,name,condition,unlocked])=>({icon,name,condition,unlocked}));}
 function html(s,date,record={},persist=()=>{},mode='academic'){
  career=rank(s);record.achievements||={};let changed=false;
  const currentRank=['未覚醒','覚醒者','探究者','超越者','到達者'].indexOf(career[0]);if(currentRank>(record.learningRank||0)){record.learningRank=currentRank;changed=true;}if((record.learningRank||0)>currentRank)career=[['未覚醒','覚醒者','探究者','超越者','到達者'][record.learningRank],'これまでの学習で到達したランクです。'];
  achievements=catalog(s).map((a,i)=>{const key='learning-v165-'+i;if(a.unlocked&&!record.achievements[key]){record.achievements[key]=true;changed=true;}return {...a,unlocked:a.unlocked||record.achievements[key]===true};});if(changed)persist();const n=achievements.filter(x=>x.unlocked).length;
  const days=window.SKIMARU_COACH.daysUntil(date),c=window.SKIMARU_COACH.coachMessage(s);
  const big=days==null?'未設定':days<0?'終了':days===0?'本日':`あと ${days}日`;
  const sub=days==null?'歯車で試験日を設定':days<0?'試験日を過ぎています':days<=7?'仕上げ期間です':'毎日少しずつ積み上げよう';
  const practical=mode==='practical', rate=practical?s.practicalRate:s.academicRate??(s.academicTotal?Math.round((s.academicCorrect||0)/s.academicTotal*100):null);
  const history=(practical?s.practicalYearHistory:s.yearHistory)||[],best=practical?window.SKIMARU_COACH.bestPastScore(history):s.bestPast;
  const metrics=`<div class="learning-metrics"><div><span>${practical?'実技':'学科'}過去問ベスト</span><b>${best==null?'—':best+'%'}</b></div><div><span>${practical?'実技':'学科'}正答率</span><b>${rate==null?'—':rate+'%'}</b></div><div><span>${practical?'実技':'学科'}回答数</span><b>${practical?s.practicalTotal:s.academicTotal}問</b></div></div>`;
  return `<section class="learning-dashboard" aria-label="学習の概要"><div class="learning-dashboard-top"><div class="learning-exam"><span>EXAM</span><b>${big}</b><small>${sub}</small></div><div class="learning-coach"><span>今日のコーチ</span><h3>${esc(c.title)}</h3><p>${esc(c.action)}</p></div></div>${metrics}<button class="learning-achievements" type="button" data-achievements><span>◇ ${esc(career[0])}</span><small>${n} / ${achievements.length} 解放</small><span aria-hidden="true">→</span></button></section>`;
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
