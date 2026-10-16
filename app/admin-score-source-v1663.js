'use strict';
(()=>{
 async function mistakes(grade,type,site){if(!authenticated||!await ensureSession())throw Error('developer_required');const response=await fetch(CLOUD.url+'/rest/v1/rpc/skimaru_mistake_summary',{method:'POST',headers:authHeaders(session.access_token),body:JSON.stringify({p_token:null,p_grade:grade,p_type:type,p_site:site}),cache:'no-store'});if(!response.ok)throw Error('summary_failed');return response.json();}
 window.SKIMARU_SCORE_SOURCE={read:()=>({authenticated:typeof authenticated!=='undefined'&&authenticated&&window.SKIMARU_DIRECTORY?.exclusions()!==null,pendingExclusions:typeof authenticated!=='undefined'&&authenticated&&window.SKIMARU_DIRECTORY?.exclusions()===null,rows:typeof rows!=='undefined'?rows:[],roster:window.SKIMARU_DIRECTORY?.snapshot()??null,scope:'',annual:true,mistakes,manageExclusions:!!window.SKIMARU_DIRECTORY?.exclusions(),setExcluded:(key,value)=>window.SKIMARU_DIRECTORY.setExcluded(key,value),excluded:window.SKIMARU_DIRECTORY?.exclusions()||[]})};
 if(typeof render==='function'){const previous=render;render=function(){const value=previous.apply(this,arguments);document.dispatchEvent(new Event('skimaru-score-data'));return value;};}
 if(typeof showLogin==='function'){const previous=showLogin;showLogin=function(){const value=previous.apply(this,arguments);document.dispatchEvent(new Event('skimaru-score-data'));return value;};}
})();
