# firebase-crypto-trade-bot

## setup
1. firebaseの初期設定
   ```
   npm install -g firebase-tools

   firebase login

   firebase init
   ```
2. node_modules install
   ```
   cd functions

   npm install
   ```

3. .envファイルを用意して以下の環境変数を設定する
   ```
   vim .env

   PROJECT_NUMBER=firebaseのプロジェクト番号
   ALLOW_IPS=リクエストを許可するIPアドレス','区切り
   ```

4. Secret Manager でシークレットを作成する
   https://cloud.google.com/secret-manager/docs/create-secret?hl=ja

   ```
   BiananceのAPI keyとAPI secretを作成し以下に設定

   projects/${process.env.PROJECT_NUMBER}/secrets/binance_api_key/versions/latest

   projects/${process.env.PROJECT_NUMBER}/secrets/binance_secret/versions/latest
   ```

## local build & run
```
cd functions

npm run serve
```


## unit test
```
cd functions
```

`npm run test` OR `npm run coverage`

## deploy
```
cd functions

npm run deploy
```