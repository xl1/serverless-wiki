## バグ報告

- たまに Save 押したときに 503 帰ってくるけど原因わかんない
    - これ古い [extension bundle 外して](https://github.com/xl1/serverless-wiki/commit/7a2f24589723fb9af4a976a2857d87e6aa72907c)から起きてない
- 


## ほしい機能

- conflict resolution
    - 今は全部後勝ちになってる
- ✅ 画像のアップロード
    - Azure Functions (node) って [blob binding で content-type を設定できない](https://github.com/Azure/azure-functions-host/issues/364)っぽい
    - ドラッグ & ドロップ か コピ & ペ で画像貼れるようになった
- タグによるページの分類


## つくらない予定

- WYSIWYG エディタ
- 共同編集
- RSS/Atom フィード
    - [GitHub の branch feed](https://github.com/xl1/serverless-wiki/commits/wiki.atom) がある
- 閲覧・編集権限の制限
    - [Azure SWA の認証機能](https://docs.microsoft.com/ja-jp/azure/static-web-apps/authentication-authorization)である程度できるので本体ではサポートしない


## どうしよっか

- 検索
- OGP とか Twitter Cards
- 自動リンク
- 自己書き換え的な機能
    - ページ上に「自分自身のページに書き足す機能」を置けるようになると掲示版みたいなのが実装できてうれしい
- ✅ 編集中の一時保存
    - 意図せずページがリロードされたときに残っていてほしい
    - 一旦、sessionStorage に記録するようになった