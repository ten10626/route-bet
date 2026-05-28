# One Tablet Party Prototype

HTML / CSS / JavaScriptのみで動く、タブレット横向き前提の1台回し型パーティーゲーム試作です。

このリポジトリは個人用試作・検索流入を想定しないものです。`index.html` には `noindex, nofollow` を設定し、`robots.txt` でも全クローラーを拒否しています。ただし、完全に検索されないことを保証するものではありません。

## 遊び方

1. 3〜8人の人数を選び、名前を入力します。
2. 親以外の子プレイヤーが順番に最大2か所までBETします。
3. 親がYES/NOで5段目まで回答します。
4. 通過したルートとBETを照合し、ポイントを精算します。
5. 全員が1回ずつ親を担当したら、最終ランキングを表示します。

## ファイル構成

- `index.html`
- `style.css`
- `script.js`
- `questions.js`
- `robots.txt`
- `README.md`

## GitHub Pages

静的ファイルのみで構成しているため、GitHub Pagesではリポジトリ直下を公開元に設定すれば動作します。
