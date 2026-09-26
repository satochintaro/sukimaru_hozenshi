"use strict";
(() => {
  const current=document.body.dataset.learningMode;
  if(current!=="academic"&&current!=="practical")return;

  const loaded=new Set();
  const preloaded=new Set();
  let spinnerShown=false;

  // 速い時はローディングを見せない。120msを超えた時だけ表示。
  const bootStyle=document.createElement("style");
  bootStyle.id="skimaru-boot-style";
  bootStyle.textContent=`
    body.skimaru-booting::before{
      content:"";position:fixed;inset:0;z-index:999990;
      background:rgba(247,249,250,.54);
      -webkit-backdrop-filter:blur(5px) saturate(.94);
      backdrop-filter:blur(5px) saturate(.94)
    }
    body.skimaru-booting::after{
      content:"";position:fixed;left:50%;top:50%;z-index:999991;
      width:34px;height:34px;margin:-17px 0 0 -17px;border-radius:50%;
      background:conic-gradient(from 10deg,#258a61 0 30%,#e8ad20 30% 48%,rgba(37,138,97,.12) 48% 100%);
      -webkit-mask:radial-gradient(farthest-side,transparent calc(100% - 5px),#000 calc(100% - 4px));
      mask:radial-gradient(farthest-side,transparent calc(100% - 5px),#000 calc(100% - 4px));
      animation:skimaruBootSpin .68s linear infinite
    }
    @keyframes skimaruBootSpin{to{transform:rotate(360deg)}}`;
  document.head.appendChild(bootStyle);

  const spinnerTimer=setTimeout(()=>{
    spinnerShown=true;
    document.body.classList.add("skimaru-booting");
  },120);

  const safetyTimer=setTimeout(finishBoot,5000);

  function finishBoot(){
    clearTimeout(spinnerTimer);
    clearTimeout(safetyTimer);
    document.body.classList.remove("skimaru-booting");
    document.getElementById("skimaru-boot-style")?.remove();
  }

  function preload(src,as){
    if(preloaded.has(src))return;
    preloaded.add(src);
    const l=document.createElement("link");
    l.rel="preload";
    l.as=as;
    l.href=src;
    document.head.appendChild(l);
  }

  function preloadAll(){
    const commonScripts=[
      "./ui-v58.js?v=591",
      "./year-mode-core.js",
      "./coach-shared.js",
      "./coach-player.js"
    ];
    const academicScripts=[
      "./academic-remove-practical.js",
      "./year-question-data.js",
      "./year-mode.js",
      "./academic-ui-v56.js",
      "./quiz-static.js?v=591"
    ];
    const practicalScripts=[
      "./practical-year-data.js",
      "./practical-year-data-v58.js",
      "./practical-year-mode.js",
      "./practical-v58.js"
    ];
    const commonStyles=["./theme-v58.css","./coach.css","./app-polish.css?v=591"];
    const academicStyles=["./academic-ui-v56.css","./answer-animation-off.css","./quiz-static.css?v=15"];

    [...commonScripts,...(current==="academic"?academicScripts:practicalScripts)]
      .forEach(s=>preload(s,"script"));
    [...commonStyles,...(current==="academic"?academicStyles:[])]
      .forEach(s=>preload(s,"style"));
  }

  function loadScript(src){
    if(loaded.has(src)||document.querySelector(`script[src="${src}"]`))return Promise.resolve();
    return new Promise((resolve,reject)=>{
      const s=document.createElement("script");
      s.src=src;
      s.async=false;
      s.onload=()=>{loaded.add(src);resolve();};
      s.onerror=()=>reject(new Error(`load failed: ${src}`));
      document.body.appendChild(s);
    });
  }

  function loadStyle(src){
    const existing=document.querySelector(`link[rel="stylesheet"][href="${src}"]`);
    if(existing){
      if(existing.sheet)return Promise.resolve();
      return new Promise(resolve=>{
        existing.addEventListener("load",resolve,{once:true});
        setTimeout(resolve,500);
      });
    }
    return new Promise(resolve=>{
      const l=document.createElement("link");
      l.rel="stylesheet";
      l.href=src;
      l.onload=resolve;
      l.onerror=resolve;
      document.head.appendChild(l);
    });
  }

  function updateVersion(){
    document.title=document.title.replace(/5\.\d+(?:\.\d+)?/g,"5.9.1").replace(/TEST/gi,"");
    if(current==="academic"){
      const st=document.querySelector("#sc-set .sts span:last-child");
      if(st)st.innerHTML='Ver 5.9.1 ／ 全 <span id="st-qn">1000</span> 問';
    }
  }

  async function loadAcademic(){
    // 先読み済みなので、依存順に実行しても通信待ちはほぼ発生しない。
    await loadScript("./year-mode-core.js");

    // 互いに依存しないものは並列実行。
    await Promise.all([
      loadScript("./ui-v58.js?v=591"),
      loadScript("./academic-remove-practical.js"),
      loadScript("./year-question-data.js"),
      loadScript("./coach-shared.js")
    ]);

    // renderQを包む順番があるものだけ順序を維持。
    await loadScript("./year-mode.js");
    await loadScript("./academic-ui-v56.js");
    await loadScript("./quiz-static.js?v=591");

    // コーチはホーム初期表示に必要なので最後に1本だけ。
    await loadScript("./coach-player.js");

    if(typeof APP!=="undefined"&&APP)APP.version="5.9.1";

    // 誤答バッジ拡張は初期表示をブロックしない。
    const idle=window.requestIdleCallback||((fn)=>setTimeout(fn,120));
    idle(()=>loadScript("./game-effects.js?v=14").catch(()=>{}),{timeout:800});
  }

  async function loadPractical(){
    await loadScript("./year-mode-core.js");

    await Promise.all([
      loadScript("./ui-v58.js?v=591"),
      loadScript("./practical-year-data.js"),
      loadScript("./practical-year-data-v58.js"),
      loadScript("./coach-shared.js")
    ]);

    await loadScript("./practical-year-mode.js");
    await loadScript("./practical-v58.js");
    await loadScript("./coach-player.js");
  }

  async function loadEnhancements(){
    try{
      preloadAll();

      const styles=["./theme-v58.css","./coach.css","./app-polish.css?v=591"];
      if(current==="academic"){
        styles.push("./academic-ui-v56.css","./answer-animation-off.css","./quiz-static.css?v=15");
      }
      await Promise.all(styles.map(loadStyle));

      if(current==="academic")await loadAcademic();
      else await loadPractical();

      // 1フレームだけ待って完成画面を確定。
      await new Promise(resolve=>requestAnimationFrame(resolve));
    }catch(error){
      console.error("高速初期化エラー",error);
    }finally{
      finishBoot();
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
