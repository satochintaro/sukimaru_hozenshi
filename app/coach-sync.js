"use strict";
(() => {
  // coach-player.js 読込後に呼ばれ、ホーム描画後の遅延DOM更新を同期化するための補助。
  // 既存の初回coach描画はcoach-player.js内で同期実行済み。
  document.documentElement.dataset.coachSync="1";
})();
