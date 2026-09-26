"use strict";
(() => {
  const current=document.body.dataset.learningMode;
  if(current!=="academic"&&current!=="practical")return;
  const loaded=new Set();

  function loadScript(src){
    if(loaded.has(src)||document.querySelector(`script[src="${src}"]`))return Promise.resolve();
    return new Promise((resolve,reject)=>{
      const s=document.createElement("script");s.src=src;s.async=false;
      s.onload=()=>{loaded.add(src);resolve();};
      s.onerror=()=>reject(new Error(`load failed: ${src}`));
      document.body.appendChild(s);
    });
  }
  function loadStyle(src){
    if(document.querySelector(`link[href="${src}"]`))return;
    const l=document.createElement("link");l.rel="stylesheet";l.href=src;document.head.appendChild(l);
  }

  function updateVersion(){
    document.title=document.title.replace(/5\.\d+(?:\.\d+)?/g,"5.8.0").replace(/TEST/gi,"");
    if(current==="academic"){
      const st=document.querySelector("#sc-set .sts span:last-child");
      if(st)st.innerHTML='Ver 5.8.0 ／ 全 <span id="st-qn">1000</span> 問';
    }
  }

  async function loadEnhancements(){
    try{
      loadStyle("./theme-v58.css");
      loadStyle("./coach.css");
      await loadScript("./ui-v58.js");
      await loadScript("./year-mode-core.js");

      if(current==="academic"){
        await loadScript("./academic-remove-practical.js");
        await loadScript("./year-question-data.js");
        await loadScript("./year-mode.js");
        loadStyle("./academic-ui-v56.css");
        await loadScript("./academic-ui-v56.js");
        if(typeof APP!=="undefined"&&APP)APP.version="5.8.0";
      }else{
        await loadScript("./practical-year-data.js");
        await loadScript("./practical-year-data-v58.js");
        await loadScript("./practical-year-mode.js");
        await loadScript("./practical-v58.js");
      }

      await loadScript("./coach-shared.js");
      await loadScript("./coach-player.js");

      if(current==="academic"){
        loadStyle("./game-effects.css");
        await loadScript("./game-effects.js");
      }
    }catch(error){
      console.error("Ver 5.8.0 拡張読込エラー",error);
    }
  }

  updateVersion();
  loadEnhancements();

  let startX=0,startY=0,startAt=0,tracking=false;
  const homeIsActive=()=>current==="academic"
    ?document.getElementById("sc-home")?.classList.contains("active")
    :document.getElementById("pt-home")?.classList.contains("active");

  document.addEventListener("touchstart",e=>{
    if(!homeIsActive()||e.touches.length!==1)return;
    const t=e.touches[0];startX=t.clientX;startY=t.clientY;startAt=Date.now();tracking=true;
  },{passive:true});

  document.addEventListener("touchend",e=>{
    if(!tracking||!homeIsActive()||!e.changedTouches.length)return;
    tracking=false;
    const t=e.changedTouches[0],dx=t.clientX-startX,dy=t.clientY-startY;
    if(Date.now()-startAt>900||Math.abs(dx)<70||Math.abs(dx)<Math.abs(dy)*1.35)return;
    if(current==="academic"&&dx<0)location.href="./practical.html";
    if(current==="practical"&&dx>0)location.href="./player.html";
  },{passive:true});
})();
