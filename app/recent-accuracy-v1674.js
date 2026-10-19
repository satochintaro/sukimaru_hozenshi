"use strict";
(() => {
  const LIMIT=100;
  const read=(key,fallback={})=>{try{return JSON.parse(localStorage.getItem(key)||'null')||fallback;}catch{return fallback;}};
  function sample(answers){
    const seen=new Set();
    const list=(Array.isArray(answers)?answers:[]).filter(a=>a&&typeof a.ok==='boolean'&&Number.isFinite(a.at)&&typeof a.id==='string').sort((a,b)=>a.at-b.at).filter(a=>{if(seen.has(a.id))return false;seen.add(a.id);return true;}).slice(-LIMIT);
    const total=list.length,correct=list.filter(a=>a.ok).length;
    return {total,correct,rate:total?Math.round(correct/total*100):null,answers:list};
  }
  function append(record,type,ok){
    const list=Array.isArray(record.recentAnswersV1)?record.recentAnswersV1:[];
    list.push({id:crypto.randomUUID(),at:Date.now(),ok:!!ok,type});
    record.recentAnswersV1=['academic','practical'].flatMap(t=>sample(list.filter(a=>a.type===t)).answers);
  }
  function batch(outcomes,attemptId,at=Date.now()){
    const time=Number.isFinite(at)?at:Date.now();
    return {outcomes:outcomes.slice(-LIMIT).map(ok=>ok?'1':'0').join(''),at:time};
  }
  const number=v=>Number.isFinite(Number(v))?Math.max(0,Number(v)):0;
  function challenge(record){
    const l=record?.suddenDeath||{},seen=new Set();let total=0,correct=0;
    for(const h of Array.isArray(l.history)?l.history:[]){if(!h?.id||seen.has(h.id))continue;seen.add(h.id);correct+=number(h.score);total+=number(h.score)+(h.reason==='incorrect'?1:0);}
    const c=l.current;if(c?.id&&!seen.has(c.id)){correct+=number(c.index);total+=number(c.index)+(c.phase==='failed'?1:0);}
    correct=Math.max(correct,number(l.correctAnswers));total=Math.max(total,number(l.totalAnswers),correct);
    return {total,correct};
  }
  function totals(record,type,normal){
    const base={...normal},sd=type==='academic'&&!normal?.includesChallenge?challenge(record):{total:0,correct:0};
    return {...base,total:number(base.total)+sd.total,correct:Math.min(number(base.total)+sd.total,number(base.correct)+sd.correct),includesChallenge:true,challengeTotal:sd.total};
  }
  function studySeconds(grade,type,entries){
    const get=(k,f={})=>{if(!entries)return read(k,f);try{return JSON.parse(entries[k]||'null')||f;}catch{return f;}};
    const clock=get('skimaru-study-time-v12');
    if(grade===1)return number(get('skimaru-grade1-v16').stats?.[type]?.seconds)+(type==='academic'?number(clock['sudden-death-grade1']?.totalMs)/1000:0);
    return Object.entries(clock).filter(([key])=>type==='academic'?key==='core'||key.includes('_gakka_')||key==='sudden-death-grade2':key.includes('_jitugi_')||key.startsWith('skimaruPractical')).reduce((n,[,v])=>n+number(v.totalMs)/1000,0);
  }
  function localTotals(grade,type){
    const r=read(grade===1?'skimaru-grade1-v16':'skimaruData');
    if(grade===2&&window.SKIMARU_TIME)return window.SKIMARU_TIME.snapshot()[type];
    const base=grade===1?r.stats?.[type]||{}:type==='academic'?r:{total:0,correct:0};
    return {...totals(r,type,base),seconds:studySeconds(grade,type)};
  }
  function sessionSeconds(grade){
    const total=studySeconds(grade,'academic')+studySeconds(grade,'practical');
    try{const key='skimaru-session-time-v1675:'+String(read('skimaruData').playerNo||'')+':'+grade,raw=sessionStorage.getItem(key);let baseline=raw===null?total:Number(raw);if(!Number.isFinite(baseline)||baseline>total)baseline=total;sessionStorage.setItem(key,String(baseline));return Math.max(0,total-baseline);}catch{return 0;}
  }
  function duration(value,compact=false){const seconds=Math.max(0,Math.round(number(value))),minutes=Math.floor(seconds/60);if(!minutes)return seconds+'秒';if(compact||minutes<60)return minutes+'分';return Math.floor(minutes/60)+'時間'+(minutes%60?minutes%60+'分':'');}
  function markDay(record,grade){
    const day=new Date(Date.now()+9*3600000).toISOString().slice(0,10);record.daily||={};record.daily[day]=number(record.daily[day])+1;
    if(grade===2&&record.lastDate!==day){const yesterday=new Date(Date.now()+9*3600000-86400000).toISOString().slice(0,10);record.streak=record.lastDate===yesterday?number(record.streak)+1:1;record.lastDate=day;}
  }
  function summary(grade,type,streak){
    const m=local(grade,type),all=localTotals(grade,type),rate=all.total?Math.round(all.correct/all.total*100)+'%':'—';
    return '<div class="ls-summary" role="region" aria-label="学習の記録"><div class="ls-summary-rates"><div><span>直近正答率</span><strong>'+text(m)+'</strong><small>'+(m.total?'直近'+m.total+'回答':'回答すると表示')+'</small></div><div><span>累計正答率</span><strong>'+rate+'</strong><small>今までの全回答</small></div></div><div class="ls-summary-details"><div><span>合計回答数</span><b>'+number(all.total).toLocaleString('ja-JP')+'<small>問</small></b></div><div><span>累計学習時間</span><b>'+duration(all.seconds)+'</b></div><div><span>連続学習日数</span><b>'+number(streak)+'<small>日</small></b></div><div><span>今回の学習時間</span><b>'+duration(sessionSeconds(grade))+'</b></div></div></div>';
  }
  function fromEntries(entries,grade,type){
    const get=(k,f={})=>{if(!entries)return read(k,f);try{return JSON.parse(entries[k]||'null')||f;}catch{return f;}};
    const record=get(grade===1?'skimaru-grade1-v16':'skimaruData');
    let answers=(Array.isArray(record.recentAnswersV1)?record.recentAnswersV1:[]).filter(a=>a.type===type);
    if(type==='academic')answers=answers.concat(record.suddenDeath?.recentAnswersV1||[]);
    if(grade===2){
      if(type==='practical'){const legacy=get('skimaruPracticalDataTestV1').recentAnswersV1;answers=answers.concat((Array.isArray(legacy)?legacy:[]).filter(a=>a.type===type));}
      const hs=get('skimaruExamHistory_v1',[]),unique=new Map((Array.isArray(hs)?hs:[]).map(h=>[h.id,h]));
      for(const h of unique.values())if(h.kind===(type==='academic'?'gakka':'jitugi')&&h.completedAt){
        const recent=h.recentAnswersV1;
        if(Array.isArray(recent))answers=answers.concat(recent);
        else if(recent&&typeof recent.outcomes==='string'&&/^[01]{1,100}$/.test(recent.outcomes))answers=answers.concat([...recent.outcomes].map((ok,i)=>({id:h.id+':'+i,at:recent.at,ok:ok==='1'})));
      }
    }
    return sample(answers);
  }
  const local=(grade,type)=>fromEntries(null,grade,type);
  const text=m=>m?.total?m.rate+'%':'—';
  function card(grade,type,cumulativeRate){
    const m=local(grade,type),full=localTotals(grade,type);
    if(full?.total)cumulativeRate=Math.round(full.correct/full.total*100);
    const c=cumulativeRate==null?'—':cumulativeRate+'%';
    return '<div class="recent-rate-card"><div><span>直近の正答率</span><strong>'+text(m)+'</strong><small>'+(m.total?'直近'+m.total+'回答':'更新後の回答から集計')+'</small></div><div><span>累計正答率</span><strong>'+c+'</strong><small>今までの全回答</small></div></div>';
  }
  window.SKIMARU_RECENT={sample,append,batch,fromEntries,local,text,card,challenge,totals,studySeconds,localTotals,sessionSeconds,duration,markDay,summary};
  if(typeof document!=='undefined')document.addEventListener('DOMContentLoaded',()=>{const grade=document.body?.classList.contains('grade1-app')||/grade1\.html/.test(location.pathname)||new URLSearchParams(location.search).get('grade')==='1'?1:2;sessionSeconds(grade);},{once:true});
})();
