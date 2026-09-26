スキマル保全士 Ver 5.9.1 高速化

主な高速化:
- PWAのJS/CSS/画像は端末キャッシュを最優先して即表示
- ネット上の最新版確認はバックグラウンドで実施
- 起動直後のService Worker更新処理をアイドル時へ移動
- 拡張JSを最初に一括preloadして通信を並列化
- 独立したJSは並列実行
- 誤答表示用の追加JSは初期表示後に遅延読込
- ローディングは120ms以上かかった時だけ表示
- ページ切替に入れていた150msの待ち時間を削除
- クエリ付きJS/CSSも同じキャッシュを使えるようService Workerを改善

アップロード5ファイル:
index.html
manifest.webmanifest
mode-swipe.js
ui-v58.js
service-worker.js

学習履歴・問題データ・Supabaseデータは変更しません。
