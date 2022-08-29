### これは何？

誰でも編集できる wiki

repository: <https://github.com/xl1/serverless-wiki>


### 特徴

- 高速
- 少ない機能
- サーバーレス


### 構成

![diagram](https://user-images.githubusercontent.com/705435/187239210-cd1fc911-0558-40d7-b9d2-2f319bdc709e.svg)

- Git リポジトリをデータベースとして使用している
- 静的 web サイトとして [Azure Static Web Apps](https://docs.microsoft.com/en-us/azure/static-web-apps/overview)（以下、SWA）でホストされている
- 更新は GitHub API を用いて、リポジトリに [commit が追加される形](https://github.com/xl1/serverless-wiki/commits/wiki)で行われる
- commit の度に GitHub Actions で SWA にデプロイされる
- デプロイされるまでの間は service worker にキャッシュしたデータを返すことで、編集した本人には即時に編集できたように見える
