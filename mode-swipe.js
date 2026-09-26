"use strict";
(() => {
  const current=document.body.dataset.learningMode;
  if(current!=="academic"&&current!=="practical")return;

  const loaded=new Set();
  const preloaded=new Set();

  // mode-swipe.jsが実行された瞬間から未完成画面を覆う。
  // リングは120msを超えた時だけ出す。
  const bootStyle=document.createElement("style");
  bootStyle.id="skimaru-boot-style";
  bootStyle.textContent=`
    body.skimaru-booting::before{
      content:"";position:fixed;inset:0;z-index:999990;
      background:rgba(247,249,250,.90);
      -webkit-backdrop-filter:blur(8px) saturate(.90);
      backdrop-filter:blur(8px) saturate(.90);
      pointer-events:all
    }
    body.skimaru-booting::after{
      content:"";position:fixed;left:50%;top:50%;z-index:999991;
      width:34px;height:34px;margin:-17px 0 0 -17px;border-radius:50%;
      background:conic-gradient(from 10deg,#258a61 0 30%,#e8ad20 30% 48%,rgba(37,138,97,.12) 48% 100%);
      -webkit-mask:radial-gradient(farthest-side,transparent calc(100% - 5px),#000 calc(100% - 4px));
      mask:radial-gradient(farthest-side,transparent calc(100% - 5px),#000 calc(100% - 4px));
      opacity:0;
      animation:skimaruBootSpin .68s linear infinite;
      pointer-events:none
    }
    body.skimaru-booting.skimaru-show-spinner::after{opacity:1}
    @keyframes skimaruBootSpin{to{transform:rotate(360deg)}}`;
  document.head.appendChild(bootStyle);
  document.body.classList.add("skimaru-booting");

  const spinnerTimer=setTimeout(()=>{
    document.body.classList.add("skimaru-show-spinner");
  },120);

  const safetyTimer=setTimeout(finishBoot,5000);

  function finishBoot(){
    clearTimeout(spinnerTimer);
    clearTimeout(safetyTimer);
    document.body.classList.remove("skimaru-show-spinner","skimaru-booting");
    document.getElementById("skimaru-boot-style")?.remove();
  }

  function preload(src,as){
    if(preloaded.has(src))return;
    preloaded.add(src);
    const link=document.createElement("link");
    link.rel="preload";
    link.as=as;
    link.href=src;
    document.head.appendChild(link);
  }

  function preloadAll(){
    const commonScripts=[
      "./ui-v58.js?v=593",
      "./year-mode-core.js",
      "./coach-shared.js",
      "./coach-player.js"
    ];

    const academicScripts=[
      "./academic-remove-practical.js",
      "./year-question-data.js",
      "./year-mode.js",
      "./academic-ui-v56.js",
      "./quiz-static.js?v=593",
      "./game-effects.js?v=593",
      "./layout-safety.js?v=593"
    ];

    const practicalScripts=[
      "./practical-year-data.js",
      "./practical-year-data-v58.js",
      "./practical-year-mode.js",
      "./practical-v58.js"
    ];

    const commonStyles=[
      "./theme-v58.css",
      "./coach.css",
      "./app-polish.css?v=593"
    ];

    const academicStyles=[
      "./academic-ui-v56.css",
      "./quiz-static.css?v=593",
      "./layout-safety.css?v=593"
    ];

    [...commonScripts,...(current==="academic"?academicScripts:practicalScripts)]
      .forEach(src=>preload(src,"script"));

    [...commonStyles,...(current==="academic"?academicStyles:[])]
      .forEach(src=>preload(src,"style"));
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
        setTimeout(resolve,400);
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
    document.title=document.title.replace(/5\.\d+(?:\.\d+)?/g,"5.9.3").replace(/TEST/gi,"");
    if(current==="academic"){
      const qn=document.getElementById("st-qn");
      if(qn)qn.textContent="1000";
    }
  }

  async function loadAcademic(){
    // 通信自体はpreloadで並列化。実行順が必要なものだけ順番を守る。
    await loadScript("./year-mode-core.js");

    await Promise.all([
      loadScript("./ui-v58.js?v=593"),
      loadScript("./academic-remove-practical.js"),
      loadScript("./year-question-data.js"),
      loadScript("./coach-shared.js")
    ]);

    await loadScript("./year-mode.js");
    await loadScript("./academic-ui-v56.js");
    await loadScript("./quiz-static.js?v=593",
      "./game-effects.js?v=593",
      "./layout-safety.js?v=593");
    await loadScript("./coach-player.js");
    await loadScript("./coach-sync.js?v=593");
    await loadScript("./game-effects.js?v=593");
    await loadScript("./layout-safety.js?v=593");

    if(typeof APP!=="undefined"&&APP)APP.version="5.9.3";
  }

  async function loadPractical(){
    await loadScript("./year-mode-core.js");

    await Promise.all([
      loadScript("./ui-v58.js?v=593"),
      loadScript("./practical-year-data.js"),
      loadScript("./practical-year-data-v58.js"),
      loadScript("./coach-shared.js")
    ]);

    await loadScript("./practical-year-mode.js");
    await loadScript("./practical-v58.js");
    await loadScript("./coach-player.js");
    await loadScript("./coach-sync.js?v=593");
  }

  async function boot(){
    try{
      preloadAll();

      const styles=["./theme-v58.css","./coach.css","./app-polish.css?v=593"];
      if(current==="academic"){
        styles.push("./academic-ui-v56.css","./quiz-static.css?v=593",
      "./layout-safety.css?v=593");
      }
      await Promise.all(styles.map(loadStyle));

      if(current==="academic")await loadAcademic();
      else await loadPractical();

      // DOM追加・CSS反映が完了したフレームまで待ち、完成形だけ見せる。
      await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    }catch(error){
      console.error("初期化エラー",error);
    }finally{
      finishBoot();
    }
  }

  updateVersion();
  boot();

  let startX=0,startY=0,startAt=0,tracking=false;
  const homeIsActive=()=>current==="academic"
    ?document.getElementById("sc-home")?.classList.contains("active")
    :document.getElementById("pt-home")?.classList.contains("active");

  document.addEventListener("touchstart",e=>{
    if(!homeIsActive()||e.touches.length!==1)return;
    const t=e.touches[0];
    startX=t.clientX;startY=t.clientY;startAt=Date.now();tracking=true;
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
