"use strict";
(() => {
 const grades=document.getElementById('title-grades'),player=document.getElementById('title-player');
 let existing=false,role='';try{existing=!!JSON.parse(localStorage.getItem('skimaruData')||'{}').name;role=localStorage.getItem('skimaru-role')||'';}catch{}
 function choose(){grades.hidden=false;player.setAttribute('aria-expanded','true');try{localStorage.setItem('skimaru-role','player');}catch{}}
 player.setAttribute('aria-controls','title-grades');player.setAttribute('aria-expanded','false');player.onclick=choose;
 document.getElementById('title-manager').onclick=()=>{try{localStorage.setItem('skimaru-role','manager');}catch{}};
 if(role==='player'||existing&&role!=='manager')choose();
})();
