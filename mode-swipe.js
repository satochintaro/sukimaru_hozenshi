"use strict";

(() => {
  const current=document.body.dataset.learningMode;
  if(current!=="academic"&&current!=="practical")return;

  // ===== Ver 5.3.0: 年度別問題データを自動読込 =====
  const loaded=new Set();
  function loadScript(src){
    if(loaded.has(src) || document.querySelector(`script[src="${src}"]`)) return Promise.resolve();
    return new Promise((resolve,reject)=>{
      const s=document.createElement("script");
      s.src=src;
      s.async=false;
      s.onload=()=>{loaded.add(src);resolve();};
      s.onerror=()=>reject(new Error(`load failed: ${src}`));
      document.body.appendChild(s);
    });
  }

  async function loadYearMode(){
    try{
      await loadScript("./year-mode-core.js");
      if(current==="academic"){
        await loadScript("./year-question-data.js");
        await loadScript("./year-mode.js");
        if(typeof APP!=="undefined" && APP) APP.version="5.3.0-test";
        document.title=document.title.replace("5.2.0","5.3.0");
      }else{
        await loadScript("./practical-year-data.js");
        await loadScript("./practical-year-mode.js");
        document.title=document.title.replace("5.2.0","5.3.0");
      }
    }catch(error){
      console.error("Ver 5.3.0 年度別データ読込エラー",error);
    }
  }
  loadYearMode();

  // ===== 既存の左右スワイプ切替 =====
  let startX=0,startY=0,startAt=0,tracking=false;
  const homeIsActive=()=>current==="academic"
    ?document.getElementById("sc-home")?.classList.contains("active")
    :document.getElementById("pt-home")?.classList.contains("active");

  document.addEventListener("touchstart",event=>{
    if(!homeIsActive()||event.touches.length!==1)return;
    const touch=event.touches[0];
    startX=touch.clientX;
    startY=touch.clientY;
    startAt=Date.now();
    tracking=true;
  },{passive:true});

  document.addEventListener("touchend",event=>{
    if(!tracking||!homeIsActive()||!event.changedTouches.length)return;
    tracking=false;
    const touch=event.changedTouches[0];
    const dx=touch.clientX-startX,dy=touch.clientY-startY;
    if(Date.now()-startAt>900||Math.abs(dx)<70||Math.abs(dx)<Math.abs(dy)*1.35)return;
    if(current==="academic"&&dx<0)location.href="./practical.html";
    if(current==="practical"&&dx>0)location.href="./player.html";
  },{passive:true});
})();
