
"use strict";
(()=>{
  function ready(fn){document.readyState==="loading"?document.addEventListener("DOMContentLoaded",fn,{once:true}):fn();}
  ready(()=>{
    const isModern=!!document.getElementById("originalPages");
    const source=isModern?document.getElementById("sourceCard"):document.getElementById("source");
    if(!source)return;

    const hint=document.createElement("div");
    hint.className="practical-focus-hint";
    hint.textContent=isModern
      ?"この問題に必要な原本ページを表示中。画像をタップすると全画面で拡大できます。"
      :"原本画像をタップすると全画面で拡大できます。";
    const head=source.querySelector(".source-head");
    if(head)head.insertAdjacentElement("afterend",hint); else source.insertAdjacentElement("afterbegin",hint);

    const viewer=document.createElement("div");
    viewer.className="practical-focus-viewer";
    viewer.setAttribute("aria-hidden","true");
    viewer.innerHTML='<div class="practical-focus-toolbar"><div><b>過去問原本</b><div class="practical-focus-zoomnote">ピンチで拡大・指で移動</div></div><button class="practical-focus-close" type="button">閉じる</button></div><div class="practical-focus-stage"><img alt="過去問原本 拡大表示"></div>';
    document.body.appendChild(viewer);
    const viewImg=viewer.querySelector("img");
    const close=()=>{
      viewer.classList.remove("open");
      viewer.setAttribute("aria-hidden","true");
      document.body.style.overflow="";
      viewImg.removeAttribute("src");
    };
    viewer.querySelector(".practical-focus-close").addEventListener("click",close);
    // 拡大後は画像をダブルタップすると閉じる。
    // 1回タップでは閉じないので、ピンチ・スクロール操作を邪魔しません。
    let lastTap=0;
    viewer.addEventListener("touchend",e=>{
      if(!viewer.classList.contains("open"))return;
      const now=Date.now();
      if(now-lastTap>0&&now-lastTap<330){
        e.preventDefault();
        lastTap=0;
        close();
        return;
      }
      lastTap=now;
    },{passive:false});
    viewer.addEventListener("dblclick",e=>{
      if(!viewer.classList.contains("open"))return;
      e.preventDefault();
      close();
    });
    document.addEventListener("keydown",e=>{if(e.key==="Escape")close();});

    document.addEventListener("click",e=>{
      const img=e.target.closest("#source img,#originalPages img");
      if(!img)return;
      viewImg.src=img.currentSrc||img.src;
      viewImg.alt=img.alt||"過去問原本 拡大表示";
      viewer.classList.add("open");
      viewer.setAttribute("aria-hidden","false");
      document.body.style.overflow="hidden";
      viewer.querySelector(".practical-focus-stage").scrollTo(0,0);
    });

    // 24/25は既存ロジックが問題番号ごとに対象原本ページを自動選択済み。
    // その挙動を維持し、画面遷移のたびにヒントを原本直上へ保つ。
    if(isModern){
      const pages=document.getElementById("originalPages");
      new MutationObserver(()=>{
        const imgs=pages.querySelectorAll("img");
        imgs.forEach(img=>img.setAttribute("title","タップして原本を拡大"));
      }).observe(pages,{childList:true,subtree:true});
    }
  });
})();
