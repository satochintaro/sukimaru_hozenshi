'use strict';
(()=>{
 window.SKIMARU_SCORE_SOURCE={read:()=>({authenticated:typeof authenticated!=='undefined'&&authenticated&&window.SKIMARU_DIRECTORY?.exclusions()!==null,pendingExclusions:typeof authenticated!=='undefined'&&authenticated&&window.SKIMARU_DIRECTORY?.exclusions()===null,rows:typeof rows!=='undefined'?rows:[],roster:window.SKIMARU_DIRECTORY?.snapshot()??null,scope:'',annual:true,manageExclusions:!!window.SKIMARU_DIRECTORY?.exclusions(),setExcluded:(key,value)=>window.SKIMARU_DIRECTORY.setExcluded(key,value),excluded:window.SKIMARU_DIRECTORY?.exclusions()||[]})};
 if(typeof render==='function'){const previous=render;render=function(){const value=previous.apply(this,arguments);document.dispatchEvent(new Event('skimaru-score-data'));return value;};}
 if(typeof showLogin==='function'){const previous=showLogin;showLogin=function(){const value=previous.apply(this,arguments);document.dispatchEvent(new Event('skimaru-score-data'));return value;};}
})();
