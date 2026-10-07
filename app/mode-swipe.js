"use strict";
(() => {
  const current=document.body.dataset.learningMode;
  if(current!=="academic"&&current!=="practical")return;
  const loaded=new Set();

  // Keep the current screen visible; put a glass loading ring over it.
  const bootStyle=document.createElement("style");
  bootStyle.id="skimaru-boot-style";
  bootStyle.textContent=`
    body.skimaru-booting::before{
      content:"";position:fixed;inset:0;z-index:999990;
      background:rgba(247,249,250,.60);
      -webkit-backdrop-filter:blur(7px) saturate(.92);
      backdrop-filter:blur(7px) saturate(.92);
    }
    body.skimaru-booting::after{
      content:"";position:fixed;left:50%;top:50%;z-index:999991;
      width:38px;height:38px;margin:-19px 0 0 -19px;border-radius:50%;
      background:conic-gradient(from 10deg,#258a61 0 28%,#e8ad20 28% 47%,rgba(37,138,97,.13) 47% 100%);
      -webkit-mask:radial-gradient(farthest-side,transparent calc(100% - 5px),#000 calc(100% - 4px));
      mask:radial-gradient(farthest-side,transparent calc(100% - 5px),#000 calc(100% - 4px));
      animation:skimaruBootSpin .72s linear infinite;
    }
    @keyframes skimaruBootSpin{to{transform:rotate(360deg)}}`;
  document.head.appendChild(bootStyle);
  document.body.classList.add("skimaru-booting");

  const safetyTimer=setTimeout(()=>{
    document.body.classList.remove("skimaru-booting");
    document.getElementById("skimaru-boot-style")?.remove();
  },7000);

  function loadScript(src){
    if(loaded.has(src)||document.querySelector(`script[src="${src}"]`))return Promise.resolve();
    return new Promise((resolve,reject)=>{
      const s=document.createElement("script");
      s.src=src;s.async=false;
      s.onload=()=>{loaded.add(src);resolve();};
      s.onerror=()=>reject(new Error(`load failed: ${src}`));
      document.body.appendChild(s);
    });
  }
  function loadStyle(src){
    const existing=document.querySelector(`link[href="${src}"]`);
    if(existing){
      if(existing.sheet)return Promise.resolve();
      return new Promise(resolve=>{
        existing.addEventListener("load",resolve,{once:true});
        setTimeout(resolve,1200);
      });
    }
    return new Promise(resolve=>{
      const l=document.createElement("link");
      l.rel="stylesheet";l.href=src;
      l.onload=resolve;l.onerror=resolve;
      document.head.appendChild(l);
    });
  }

  function updateVersion(){
    document.title=document.title.replace(/5\.\d+(?:\.\d+)?/g,"5.9.0").replace(/TEST/gi,"");
    if(current==="academic"){
      const st=document.querySelector("#sc-set .sts span:last-child");
      if(st)st.innerHTML='Ver 5.9.0 ／ 全 <span id="st-qn">1000</span> 問';
    }
  }

  async function loadEnhancements(){
    try{
      const commonStyles=["./theme-v58.css?v=15.3","./coach.css?v=15.3","./app-polish.css?v=590","./learning-home.css?v=16.6"];
      if(current==="academic"){
        commonStyles.push("./academic-ui-v56.css","./answer-animation-off.css","./quiz-static.css?v=15");
      }
      await Promise.all(commonStyles.map(loadStyle));

      const scripts=["./ui-v58.js?v=590","./year-mode-core.js"];
      if(current==="academic")scripts.push("./academic-remove-practical.js","./year-question-data.js","./year-mode.js","./academic-ui-v56.js","./quiz-static.js?v=590","./coach-shared.js","./learning-home.js?v=16.11","./coach-player.js?v=16.10","./game-effects.js?v=14");
      else scripts.push("./practical-year-data.js","./practical-year-data-v58.js","./practical-year-mode.js","./practical-v58.js","./coach-shared.js","./learning-home.js?v=16.11","./coach-player.js?v=16.10");
      // async=false preserves insertion/execution order; requests are concurrent.
      await Promise.all(scripts.map(loadScript));
      if(typeof APP!=="undefined"&&APP)APP.version="16.10";

      await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    }catch(error){
      console.error("画面初期化エラー",error);
    }finally{
      const look=document.querySelector('link[href*="app-look-v14.css"]');if(look)document.head.append(look);
      const dashboardStyle=document.querySelector('link[href*="learning-home.css"]');if(dashboardStyle)document.head.append(dashboardStyle);
      const sharedHomeStyle=document.querySelector('link[href*="learning-layout.css"]');if(sharedHomeStyle)document.head.append(sharedHomeStyle);
      if(typeof APP!=="undefined")APP.version="16.10";
      const sub=document.querySelector('#sc-home .hd-sub');if(sub)sub.textContent='自主保全士2級 / 学科';
      const ver=document.querySelector('#sc-set .sts span:last-child');if(ver)ver.innerHTML='Ver 16.10 ／ 全 <span id="st-qn">'+(window.QUESTIONS?.length||1000)+'</span> 問';

      clearTimeout(safetyTimer);
      document.body.classList.remove("skimaru-booting");
      document.getElementById("skimaru-boot-style")?.remove();
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
