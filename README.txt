画面表示キャッシュ修正版

GitHub main直下の service-worker.js をこのファイルで上書きしてください。

変更対象は service-worker.js だけです。
タイトル画面・PLAYER画面・MANAGER画面・学科・問題データは変更しません。

修正内容:
・HTML画面は常にネットワークから最新版を取得
・JS/CSSもオンライン時は最新版を取得
・古い skimaru-* キャッシュを新Service Worker有効化時に削除
・画像は従来どおりキャッシュ利用

これにより通常の PLAYER → 実技 から practical.html を開いた場合も、
古いVer 5.9.8ではなく現在の2022〜2025画面を取得する構成です。
