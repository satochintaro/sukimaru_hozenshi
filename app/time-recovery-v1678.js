"use strict";
(()=>{
 const read=(k,f={})=>{try{return JSON.parse(localStorage.getItem(k)||'null')||f;}catch{return f;}};
 let busy=false;
 async function recover(){
  const member=read('skimaru-registration-v13'),profile=read('skimaruData'),cloud=window.SKIMARU_SUPABASE,R=window.SKIMARU_RECENT;
  if(busy||!R||!cloud?.url||!member.token||member.playerNo!==profile.playerNo)return;
  busy=true;const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);
  try{
   const response=await fetch(cloud.url+'/rest/v1/rpc/skimaru_player_time_floor',{method:'POST',headers:{apikey:cloud.publishableKey,'Content-Type':'application/json'},body:JSON.stringify({p_player_no:member.playerNo,p_token:member.token}),cache:'no-store',signal:controller.signal});
   const data=await response.json();if(!response.ok||data.state!=='active'||!Array.isArray(data.rows)||read('skimaruData').playerNo!==member.playerNo)return;
   let changed=false;const added={1:0,2:0};
   for(const row of data.rows){
    if(![1,2].includes(row.grade)||!['academic','practical'].includes(row.examType)||!Number.isFinite(row.seconds)||row.seconds<0||row.seconds>31536000)continue;
    const record=read(row.grade===1?'skimaru-grade1-v16':'skimaruData');if(Number(record.progressEpoch||0)!==Number(row.progressEpoch||0))continue;
    const delta=Math.max(0,Math.round(row.seconds-(R.localTotals(row.grade,row.examType)?.seconds||0)));if(!delta)continue;
    const clock=read('skimaru-study-time-v12'),key='recovered-grade'+row.grade+'-'+row.examType,old=R.recoveredSeconds(row.grade,row.examType);
    clock[key]={totalMs:(old+delta)*1000,owner:member.playerNo,epoch:Number(row.progressEpoch||0),recoveredAt:new Date().toISOString(),attempts:{}};
    localStorage.setItem('skimaru-study-time-v12',JSON.stringify(clock));added[row.grade]+=delta;changed=true;
   }
   if(changed){
    for(const grade of [1,2]){const key='skimaru-session-time-v1675:'+member.playerNo+':'+grade,old=sessionStorage.getItem(key);if(old!==null&&Number.isFinite(Number(old)))sessionStorage.setItem(key,String(Number(old)+added[grade]));}
    const grade=document.body.classList.contains('grade1-app')?1:2,type=/実技/.test(document.querySelector('.app-subtitle,.learning-header small')?.textContent||'')?'practical':'academic';
    document.querySelectorAll('.ls-summary').forEach(el=>{const streak=el.querySelector('.ls-summary-details>div:nth-child(3) b')?.textContent;el.outerHTML=R.summary(Number(el.dataset.grade)||grade,el.dataset.examType||type,parseInt(streak)||0);});
    window.dispatchEvent(new Event('skimaru-time-recovered'));window.SKIMARU_SYNC?.flush().catch(()=>{});
   }
  }catch{/* Offline: keep all existing records and retry when online. */}finally{clearTimeout(timer);busy=false;}
 }
 document.addEventListener('DOMContentLoaded',recover,{once:true});window.addEventListener('online',recover);
 window.addEventListener('skimaru-auth-repaired',recover);
 window.SKIMARU_TIME_RECOVERY={recover};
})();
