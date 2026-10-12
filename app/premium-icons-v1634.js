"use strict";
(() => {
 const paths={
 book:'<path d="M3 5c3-1 6-1 9 1 3-2 6-2 9-1v14c-3-1-6-1-9 1-3-2-6-2-9-1z"/><path d="M12 6v14"/>',
 gear:'<path d="m9 3-.5 3-2 1.2-2.7-1-2 3.5L4 12l-2.2 2.3 2 3.5 2.7-1 2 1.2.5 3h4l.5-3 2-1.2 2.7 1 2-3.5L19 12l2.2-2.3-2-3.5-2.7 1-2-1.2-.5-3z"/><circle cx="11" cy="12" r="3.2"/>',
 arrow:'<path d="M4 12h16m-6-6 6 6-6 6"/>',
 back:'<path d="m15 5-7 7 7 7"/>',
 menu:'<path d="M5 6h14M5 12h14M5 18h14"/>',
 mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 6 9 7 9-7"/>',
 people:'<circle cx="9" cy="7" r="3"/><path d="M3 20v-3c0-5 12-5 12 0v3zM16 4c5 0 5 6 0 6m2 4c3 0 3 3 3 6"/>',
 restore:'<path d="M5 10a8 8 0 1 1 0 8M5 10V4m0 6h6"/><path d="M13 8v5l3 2"/>',
 report:'<path d="m14 4-4 4 1 4 4 1 4-4c1 4-2 8-6 8L7 22l-4-4 6-6C8 8 10 4 14 4z"/>',
 clipboard:'<rect x="5" y="4" width="14" height="17" rx="2"/><rect x="9" y="2" width="6" height="4" rx="1"/><path d="M9 11h6M9 15h6"/>',
 plus:'<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M12 7v10M7 12h10"/>',
 calendar:'<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M7 3v4M17 3v4M7 14h2M14 14h2M7 18h2"/>',
 chart:'<path d="M3 21h18M5 20v-8h4v8M11 20V4h4v16M17 20v-12h4v12"/>',
 repeat:'<path d="M3 11a9 9 0 1 1 1 7M3 11V5m0 6h6"/>',
 focus:'<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9z"/>',
 diamond:'<path d="m3 8 4-5h10l4 5-9 13zM3 8h18M7 3l5 18 5-18"/>',
 target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><path d="m12 12 8-8M17 4h3v3"/>',
 file:'<path d="M5 3h10l4 4v14H5zM14 3v5h5M8 12h8M8 16h8"/>',
 check:'<path d="m5 12 4 4L19 6"/>',
 bolt:'<path d="m14 2-9 12h6l-1 8 9-12h-6z"/>',
 home:'<path d="m3 10 9-8 9 8v11h-7v-7h-4v7H3z"/>',
 info:'<circle cx="12" cy="12" r="9"/><path d="M12 10v7M12 6v1"/>'
 };
 const svg=(name,cls='')=>'<svg class="premium-icon '+cls+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(paths[name]||paths.book)+'</svg>';
 window.SKIMARU_ICONS={svg};
})();
