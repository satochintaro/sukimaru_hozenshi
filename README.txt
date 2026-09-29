Ver 5.9.8 実技ページ Safariクラッシュ対策

実技ページを安全モード化:
- mode-swipe.js を実技ページから外す
- ui-v58.js を実技ページから外す
- coach-player.js を実技ページから一旦外す
- 起動オーバーレイなし
- DOM監視なし
- 自動リロードなし
- 2019〜2025年度データ維持
- 全90課題維持
- 長文は問題部分だけ内部スクロール
- 回答エリアは別スクロール
- Service WorkerはHTMLをnetwork-firstへ変更
- 古いキャッシュをactivate時に削除
- 学習履歴/localStorageは変更しない

アップロード:
practical.html
practical-safe-v598.css
practical-safe-v598.js
service-worker.js
ui-v58.js
index.html
manifest.webmanifest

アップロード後:
1. practical.htmlを直接開かない
2. Safariでトップ(index.html)を1回開く
3. 2〜3秒待つ
4. プレイヤー → 実技 を開く
