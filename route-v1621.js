"use strict";
(() => {
 const script=document.currentScript;
 if(!script?.dataset.target)return;
 const target=new URL(script.dataset.target,location.href);
 target.search=location.search;
 target.hash=location.hash;
 location.replace(target.href);
})();
