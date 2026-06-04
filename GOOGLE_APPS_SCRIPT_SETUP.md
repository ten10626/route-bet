# お題候補投稿のGoogleスプレッドシート保存設定

ROUTE BETのお題候補投稿は、Google Apps ScriptのWebアプリ経由で次のスプレッドシートへ保存します。

対象スプレッドシート:

`https://docs.google.com/spreadsheets/d/1y9xBAmObTO_EKpvrpzK_2vJR_iKxp7K8ODqP8Kr-Jf4/edit`

保存先シート:

`responses`

列名:

`timestamp`, `question`

## 1. Apps Scriptを開く

1. 対象スプレッドシートを開きます。
2. 上部メニューの「拡張機能」をクリックします。
3. 「Apps Script」をクリックします。
4. Apps Scriptエディタが開きます。

## 2. コードを設定する

1. Apps Scriptエディタ内の既存コードを削除します。
2. リポジトリの `google-apps-script.gs` の内容を貼り付けます。
3. 保存します。

このコードはスプレッドシートID `1y9xBAmObTO_EKpvrpzK_2vJR_iKxp7K8ODqP8Kr-Jf4` を直接指定しています。`responses` シートがない場合は自動作成し、1行目に `timestamp` と `question` を設定します。

## 3. Webアプリとしてデプロイする

1. Apps Script右上の「デプロイ」をクリックします。
2. 「新しいデプロイ」をクリックします。
3. 種類の歯車アイコンから「ウェブアプリ」を選択します。
4. 説明に `ROUTE BET question submission` などを入力します。
5. 「実行するユーザー」を「自分」にします。
6. 「アクセスできるユーザー」を「全員」にします。
7. 「デプロイ」をクリックします。
8. 初回は権限確認が出るので、スプレッドシートへのアクセスを許可します。
9. 表示された「ウェブアプリURL」を控えます。

## 4. ROUTE BETへURLを設定する

`config.js` の `questionSubmissionEndpoint` に、手順3で取得したWebアプリURLを設定します。

```js
const ROUTE_BET_CONFIG = Object.freeze({
  questionSubmissionEndpoint: "https://script.google.com/macros/s/ここにデプロイID/exec"
});
```

設定後、`index.html` の読み込みバージョンを更新し、GitHubへcommit/pushします。

## 5. 投稿テスト

1. GitHub PagesのROUTE BETを開きます。
2. タイトル画面の「お題候補を投稿」を押します。
3. 次のように複数行で入力します。

```text
雨の日が好き

金縛りにあったことがある
透明人間より瞬間移動が欲しい
```

4. 「送信」を押します。
5. 「投稿ありがとうございました」と表示されることを確認します。
6. スプレッドシートの `responses` シートに、空行を除いた3件が1行1問で保存されていることを確認します。

## 送信データ

フロント側は次の形式でWebアプリへPOSTします。

```json
{
  "version": 1,
  "candidates": [
    {
      "question": "雨の日が好き",
      "submitterName": "",
      "category": ""
    }
  ]
}
```

現時点で保存する列は `timestamp` と `question` のみです。将来、投稿者名・カテゴリ・採用管理を追加する場合は、`google-apps-script.gs` の `HEADERS` と保存行を拡張してください。
