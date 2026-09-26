"use strict";
(() => {
  // Fail-safe for a navigation/loading class left behind by a failed load.
  setTimeout(()=>{
    document.body.classList.remove(
      "page-transitioning",
      "skimaru-booting",
      "skimaru-show-spinner"
    );
  },800);

  window.addEventListener("pageshow",()=>{
    document.body.classList.remove(
      "page-transitioning",
      "skimaru-booting",
      "skimaru-show-spinner"
    );
  });
})();
