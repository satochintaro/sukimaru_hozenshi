"use strict";
(() => {
  const CLOUD=window.SKIMARU_SUPABASE||{};
  function notifyLocal(m){if(typeof notify==="function")notify(m);else alert(m);}
  async function setViewerPassword(password){
    if(String(password||"").length<8){notifyLocal("閲覧用パスワードは8文字以上にしてください");return;}
    if(typeof ensureSession!=="function"||!(await ensureSession())){notifyLocal("管理者ログインが必要です");return;}
    const r=await fetch(`${CLOUD.url}/rest/v1/rpc/set_manager_viewer_password`,{
      method:"POST",
      headers:{apikey:CLOUD.publishableKey,Authorization:`Bearer ${session.access_token}`,"Content-Type":"application/json"},
      body:JSON.stringify({p_password:password}),
      cache:"no-store"
    });
    if(!r.ok){notifyLocal("閲覧用パスワードを設定できませんでした");return;}
    notifyLocal("閲覧用パスワードを更新しました");
    const input=document.getElementById("manager-viewer-set-input");if(input)input.value="";
  }

  function openPanel(){
    const modal=document.getElementById("manager-viewer-settings");
    if(modal){modal.classList.add("show");modal.setAttribute("aria-hidden","false");}
  }
  function closePanel(){
    const modal=document.getElementById("manager-viewer-settings");
    if(modal){modal.classList.remove("show");modal.setAttribute("aria-hidden","true");}
  }

  const actions=document.querySelector(".manager-actions");
  if(actions&&!document.getElementById("manager-viewer-settings-btn")){
    const b=document.createElement("button");b.type="button";b.className="btn-g";b.id="manager-viewer-settings-btn";b.textContent="閲覧パス設定";b.addEventListener("click",openPanel);actions.appendChild(b);
  }
  document.getElementById("manager-viewer-set-save")?.addEventListener("click",()=>setViewerPassword(document.getElementById("manager-viewer-set-input").value));
  document.getElementById("manager-viewer-set-close")?.addEventListener("click",closePanel);
  document.getElementById("manager-viewer-settings")?.addEventListener("click",e=>{if(e.target.id==="manager-viewer-settings")closePanel();});
})();
