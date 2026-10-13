"use strict";
(() => {
 if(window.SKIMARU_DEMO_ACCESS)return;
 const key='skimaru-supabase-manager-session-v1';
 const session=()=>{try{return JSON.parse(sessionStorage.getItem(key)||'null');}catch{return null;}};
 const available=()=>!!session()?.access_token;
 async function authorize(){
  const s=session(),c=window.SKIMARU_SUPABASE;if(!s?.access_token||!c?.url||!c.publishableKey)return false;
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);
  try{const response=await fetch(c.url+'/rest/v1/rpc/skimaru_developer_demo_access',{method:'POST',headers:{apikey:c.publishableKey,Authorization:'Bearer '+s.access_token,'Content-Type':'application/json'},body:'{}',cache:'no-store',signal:controller.signal});const result=await response.json();return response.ok&&result.authorized===true&&session()?.access_token===s.access_token;}catch{return false;}finally{clearTimeout(timer);}
 }
 window.SKIMARU_DEMO_ACCESS={available,authorize};
})();
