Ver 5.9.5 タップ不能 緊急修正

原因:
- 5.9.4 mode-swipe.js の loadScript 呼び出しが壊れていた
- 起動オーバーレイが pointer-events:all でタップを遮断する可能性があった

修正:
- mode-swipe.js を正常な読込順に再構築
- loadScript(undefined) を完全排除
- 起動/画面遷移オーバーレイは pointer-events:none
- page-transitioning / booting が残っても800msで自動解除
- 問題画面の表示中ボタンは常にタップ可能
- Service Worker cacheをr21へ更新

アップロード:
mode-swipe.js
input-safety-v595.css
input-safety-v595.js
ui-v58.js
service-worker.js
index.html（同梱時）
manifest.webmanifest（同梱時）
