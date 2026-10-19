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
  function fromEntries(entries,grade,type){
    const get=(k,f={})=>{if(!entries)return read(k,f);try{return JSON.parse(entries[k]||'null')||f;}catch{return f;}};
    const record=get(grade===1?'skimaru-grade1-v16':'skimaruData');
    let answers=(Array.isArray(record.recentAnswersV1)?record.recentAnswersV1:[]).filter(a=>a.type===type);
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
    const m=local(grade,type),full=grade===2?window.SKIMARU_TIME?.snapshot()?.[type]:null;
    if(full?.total)cumulativeRate=Math.round(full.correct/full.total*100);
    const c=cumulativeRate==null?'—':cumulativeRate+'%';
    return '<div class="recent-rate-card"><div><span>直近の正答率</span><strong>'+text(m)+'</strong><small>'+(m.total?'直近'+m.total+'回答':'更新後の回答から集計')+'</small></div><div><span>累計正答率</span><strong>'+c+'</strong><small>今までの全回答</small></div></div>';
  }
  window.SKIMARU_RECENT={sample,append,batch,fromEntries,local,text,card};
})();
