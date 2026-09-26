Ver 5.8.3 PWA更新修正

目的:
Safariでは最新版なのに、ホーム画面PWAだけ旧画面が残る問題を修正。

変更:
- Service Worker登録URLを ?v=583 で更新
- updateViaCache:"none" を使用
- 新Service Workerがcontrollerになったら1回だけ自動再読込
- PWAをバックグラウンドから戻した時にも更新確認
- HTML/JS/CSSはService Workerでも network-first + no-store
- manifest start_url を index.html?v=583 に更新
- サイトデータ削除不要

上書き5ファイル:
index.html
ui-v58.js
mode-swipe.js
service-worker.js
manifest.webmanifest
