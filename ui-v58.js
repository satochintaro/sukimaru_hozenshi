"use strict";
(() => {
  const VERSION="5.9.1";
  const RELOAD_KEY="skimaru-pwa-reload-591";
  const SOUND_KEY="skimaru-sound-enabled";

  document.body.classList.add("v58");

  document.title=document.title
    .replace(/Ver\s*5\.\d+(?:\.\d+)?\s*TEST/gi,`Ver ${VERSION}`)
    .replace(/5\.\d+(?:\.\d+)?/g,VERSION)
    .replace(/\bTEST\b/gi,"");

  // -------- sound engine (Web Audio, no external audio files) --------
  let audioCtx=null;
  let soundEnabled=localStorage.getItem(SOUND_KEY)!=="0";

  function ctx(){
    if(!soundEnabled)return null;
    if(!audioCtx){
      const AC=window.AudioContext||window.webkitAudioContext;
      if(!AC)return null;
      audioCtx=new AC();
    }
    if(audioCtx.state==="suspended")audioCtx.resume().catch(()=>{});
    return audioCtx;
  }

  function tone(freq,duration=0.035,volume=0.018,type="sine",delay=0){
    const c=ctx(); if(!c)return;
    const t=c.currentTime+delay;
    const osc=c.createOscillator(), gain=c.createGain();
    osc.type=type;
    osc.frequency.setValueAtTime(freq,t);
    gain.gain.setValueAtTime(0.0001,t);
    gain.gain.exponentialRampToValueAtTime(Math.max(.0002,volume),t+.006);
    gain.gain.exponentialRampToValueAtTime(.0001,t+duration);
    osc.connect(gain);gain.connect(c.destination);
    osc.start(t);osc.stop(t+duration+.015);
  }

  const Sound={
    enabled:()=>soundEnabled,
    set(on){
      soundEnabled=!!on;
      localStorage.setItem(SOUND_KEY,soundEnabled?"1":"0");
      if(soundEnabled){ctx();tone(620,.028,.014);}
      updateSoundSwitch();
    },
    tap(){tone(590,.026,.011,"sine");},
    nav(){tone(520,.032,.010,"sine",0);tone(690,.038,.009,"sine",.035);},
    correct(){tone(620,.045,.018,"sine",0);tone(830,.065,.017,"sine",.045);},
    wrong(){tone(330,.055,.014,"triangle",0);tone(260,.070,.012,"triangle",.05);}
  };
  window.SkimaruSound=Sound;

  function updateSoundSwitch(){
    const sw=document.getElementById("sw-sound");
    if(!sw)return;
    sw.classList.toggle("on",soundEnabled);
    sw.setAttribute("aria-checked",String(soundEnabled));
  }

  function installSoundSetting(){
    if(document.getElementById("sound-setting-row"))return;
    const screen=document.querySelector("#sc-set .scroll");
    if(!screen)return;

    const notes=[...screen.querySelectorAll(".note")];
    const dataNote=notes.find(n=>n.textContent.includes("データ"));
    const row=document.createElement("div");
    row.id="sound-setting-row";
    row.className="pn row sound-setting-row";
    row.style.marginBottom="10px";
    row.innerHTML=`
      <span class="row-i">🔊</span>
      <span class="row-b"><span class="row-t">操作音</span><span class="row-d">ボタン・正解・不正解の短い効果音</span></span>
      <button aria-checked="${soundEnabled}" aria-label="操作音" class="sw ${soundEnabled?"on":""}" id="sw-sound" role="switch"></button>`;
    row.querySelector("#sw-sound").addEventListener("click",e=>{
      e.stopPropagation();
      Sound.set(!soundEnabled);
    });
    if(dataNote)screen.insertBefore(row,dataNote);
    else screen.appendChild(row);
  }

  // First user interaction unlocks iOS audio. Avoid duplicate tap sound for answer buttons:
  document.addEventListener("click",e=>{
    const target=e.target.closest("button,a,[role='button']");
    if(!target)return;
    ctx();
    if(!target.matches(".btn-ox"))Sound.tap();
  },true);

  // Elegant page transition for real navigation only.
  document.addEventListener("click",e=>{
    if(e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
    const a=e.target.closest("a[href]");
    if(!a||a.target==="_blank"||a.hasAttribute("download"))return;
    const href=a.getAttribute("href");
    if(!href||href.startsWith("#")||href.startsWith("javascript:"))return;

    let url;
    try{url=new URL(a.href,location.href);}catch(_){return;}
    if(url.origin!==location.origin)return;
    e.preventDefault();
    Sound.nav();
    document.body.classList.add("page-transitioning");
    requestAnimationFrame(()=>{ location.href=url.href; });
  });

  const mode=document.body.dataset.learningMode;
  if(mode==="academic"){
    document.querySelectorAll("#sc-home .practical-entry").forEach(el=>el.remove());
    const sub=document.querySelector("#sc-home .hd-sub");
    if(sub)sub.textContent=`自主保全士2級 / 学科 / Ver ${VERSION}`;
    installSoundSetting();
  }

  if(mode==="practical"){
    const title=document.querySelector("#pt-home .hd-ttl");
    const sub=document.querySelector("#pt-home .hd-sub");
    if(title)title.textContent="実技演習";
    if(sub)sub.textContent=`自主保全士2級 / 実技 / Ver ${VERSION}`;
    document.querySelector("#pt-home .pt-test-badge")?.remove();
    const hero=document.querySelector("#pt-home .pt-hero");
    if(hero){
      const label=hero.querySelector(":scope > span");
      const h1=hero.querySelector("h1");
      const p=hero.querySelector("p");
      const small=hero.querySelector("small");
      if(label)label.textContent="実技演習";
      if(h1)h1.textContent="実技演習";
      if(p)p.textContent="課題文や図を見ながら、空欄に入る語句を選んで理解を定着させます。";
      if(small)small.textContent="全90課題 / ランダム10課題 / 2019〜2025年度ベース";
    }
    const primary=document.querySelector("#pt-home .pt-primary");
    if(primary)primary.textContent="ランダム10課題";
  }

  const managerSub=document.querySelector(".manager-header .hd-sub");
  if(managerSub){
    managerSub.textContent=document.body.classList.contains("viewer-page")
      ?`閲覧専用 / Ver ${VERSION}`
      :`全体・個人分析 / Ver ${VERSION}`;
  }

  // -------- PWA update --------
  if("serviceWorker" in navigator){
    let controllerChanged=false;
    navigator.serviceWorker.addEventListener("controllerchange",()=>{
      if(controllerChanged)return;
      controllerChanged=true;
      if(sessionStorage.getItem(RELOAD_KEY)!=="1"){
        sessionStorage.setItem(RELOAD_KEY,"1");
        location.reload();
      }
    });

    window.addEventListener("load",()=>{
      const run=async()=>{
        try{
          const reg=await navigator.serviceWorker.register("./service-worker.js?v=591",{updateViaCache:"none"});
          if(reg.waiting)reg.waiting.postMessage({type:"SKIP_WAITING"});
          reg.update().catch(()=>{});
          document.addEventListener("visibilitychange",()=>{
            if(document.visibilityState==="visible"){
              const idle=window.requestIdleCallback||((fn)=>setTimeout(fn,500));
              idle(()=>reg.update().catch(()=>{}),{timeout:1500});
            }
          });
        }catch(e){
          console.warn("PWA update check failed",e);
        }
      };
      const idle=window.requestIdleCallback||((fn)=>setTimeout(fn,900));
      idle(run,{timeout:1800});
    });
  }
})();
