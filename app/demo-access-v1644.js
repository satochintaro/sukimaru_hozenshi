"use strict";
(() => {
 if(window.SKIMARU_DEMO_ACCESS)return;
 const key='skimaru-supabase-manager-session-v1';
 const session=()=>{try{return JSON.parse(sessionStorage.getItem(key)||'null');}catch{return null;}};
 const available=()=>!!session()?.access_token;
 let refreshing=null;
 async function headers(force=false){
  const c=window.SKIMARU_SUPABASE;if(!c?.url||!c.publishableKey)return null;
  if(typeof window.ensureSession==='function'){
   if(!await window.ensureSession())return null;
   const current=session();return current?.access_token?{Authorization:'Bearer '+current.access_token}:null;
  }
  const s=session();if(!s?.access_token)return null;
  if(!force&&(s.expires_at_ms||0)>Date.now()+60000)return {Authorization:'Bearer '+s.access_token};
  if(!s.refresh_token)return null;
  if(!refreshing)refreshing=(async()=>{
   const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),8000);
   try{
    const response=await fetch(c.url+'/auth/v1/token?grant_type=refresh_token',{method:'POST',headers:{apikey:c.publishableKey,'Content-Type':'application/json'},body:JSON.stringify({refresh_token:s.refresh_token}),cache:'no-store',signal:ctl.signal});
    const result=await response.json();
    if(session()?.refresh_token!==s.refresh_token)return session();
    if(!response.ok||!result.access_token||!result.refresh_token){if(response.status===400||response.status===401){sessionStorage.removeItem(key);return null;}const e=Error('network_session_refresh');e.code='network';throw e;}
    const next={...s,...result,expires_at_ms:Date.now()+(Number(result.expires_in)||3600)*1000};sessionStorage.setItem(key,JSON.stringify(next));return next;
   }finally{clearTimeout(timer);}
  })().finally(()=>{refreshing=null;});
  const next=await refreshing;return next?.access_token?{Authorization:'Bearer '+next.access_token}:null;
 }
 async function authorize(){
  const c=window.SKIMARU_SUPABASE;const auth=await headers();if(!auth||!c?.url||!c.publishableKey)return false;
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);
  try{const response=await fetch(c.url+'/rest/v1/rpc/skimaru_developer_demo_access',{method:'POST',headers:{apikey:c.publishableKey,...auth,'Content-Type':'application/json'},body:'{}',cache:'no-store',signal:controller.signal});const result=await response.json();return response.ok&&result.authorized===true&&'Bearer '+session()?.access_token===auth.Authorization;}catch{return false;}finally{clearTimeout(timer);}
 }
 window.SKIMARU_DEMO_ACCESS={available,authorize,headers};
})();

