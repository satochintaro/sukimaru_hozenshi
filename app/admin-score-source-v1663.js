'use strict';
(()=>{
 window.SKIMARU_SCORE_SOURCE={read:()=>({authenticated:typeof authenticated!=='undefined'&&authenticated,rows:typeof rows!=='undefined'?rows:[],roster:window.SKIMARU_DIRECTORY?.snapshot()??null,scope:'',excluded:typeof hiddenPlayers!=='undefined'?[...hiddenPlayers]:[]})};
 if(typeof render==='function'){const previous=render;render=function(){const value=previous.apply(this,arguments);document.dispatchEvent(new Event('skimaru-score-data'));return value;};}
 if(typeof showLogin==='function'){const previous=showLogin;showLogin=function(){const value=previous.apply(this,arguments);document.dispatchEvent(new Event('skimaru-score-data'));return value;};}
})();
