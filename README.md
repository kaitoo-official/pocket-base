# Pocket Base

スマホゲーム「Pokémon TCG Pocket」の**非公式**カード検索アプリです。
Next.js + Firebase で Web 版を作り、Capacitor で iOS / Android アプリにして、2026年10月に App Store で公開しました。
企画・実装・テスト・ストア申請・運用まで一人で担当した個人開発（自主制作）です。

An unofficial card search app for Pokémon TCG Pocket. Built solo with Next.js, TypeScript and Firebase, wrapped with Capacitor, and released on the App Store in October 2026.

| | |
|---|---|
| Web | https://pocket-base-delta.vercel.app |
| iOS | [App Store](https://apps.apple.com/jp/app/pocket-base/id6817170301)（2026-10-24 公開・無料） |
| Android | Google Play クローズドテスト中（本番公開前） |

> Pocket Base は、Pokémon Trading Card Game Pocket のファンが作った非公式のアプリ・サイトです。The Pokémon Company、任天堂、クリーチャーズ、ゲームフリークとは一切関係がなく、公認・提携を受けたものでもありません。カード名・画像・ゲーム内の文章などの権利は、それぞれの権利者に帰属します。

## 主な機能

- **カード検索・絞り込み**：名前・技・特性で検索（日本語対応）、タイプ・レアリティなどの複数条件フィルター、並び替え
- **カード詳細・パック一覧**：技・特性・入手できるパック
- **日本語化**：英語のみのカードデータに、日本語の名前・技名・効果文の対応表を作って全件を日本語表示
- **ログイン**：Google / Apple でサインイン。ゲストで使ったデータをログイン時に引き継ぎ
- **アカウント機能**：ほしいリスト・所持カードの記録・デッキ作成（ゲームのルールで枚数をチェック）
- **トレード掲示板**：投稿・コメント・通報・ブロック
- **アカウント削除**・ログイン前の利用規約同意（App Store 審査の要件に対応）

## 技術構成

| 分野 | 使ったもの |
|---|---|
| フロントエンド | Next.js（App Router）・React・TypeScript・Tailwind CSS |
| バックエンド | Firebase Authentication（Google / Apple / 匿名）・Cloud Firestore・Firestore セキュリティルール |
| ホスティング | Vercel（GitHub 連携の自動デプロイ） |
| モバイル | Capacitor（iOS / Android）・@capacitor-firebase/authentication |
| ビルド・配信 | Codemagic（クラウド Mac で iOS ビルド → App Store Connect へ自動アップロード）・Google Play Console |
| データ | npm パッケージ `pokemon-tcg-pocket-cards`（v5）＋日本語の対応表（`lib/data/`） |

## 仕組み

```
カードデータ（npm パッケージ）＋日本語の対応表
        ↓ 読み込み・変換（lib/data.ts）
Next.js（Vercel） ←→ Firebase Authentication / Firestore（セキュリティルールでアクセス制御）
        ↓ 同じ Web サイトを表示
Capacitor の iOS / Android アプリ（ネイティブのログイン・戻るボタン・起動画面・下タブ）
```

- アプリは公開中の Web サイトを Capacitor で表示する作り（`server.url` 方式）。Web を直せば Web・iOS・Android に同時に反映できます。
- そのかわり Web が止まるとアプリも止まるため、Web 側の変更はアプリへの影響も確認する前提にしています。
- ログインは、アプリではネイティブのログイン画面を使い、結果を Web 側の Firebase に渡して1つの状態にまとめています。

## 開発で対応した主な課題

| 症状 | 原因 | 対応 |
|---|---|---|
| Apple でログインすると、保存がすべて権限エラーになる | Firestore のルールが Google ログインしか許可していなかった | Google / Apple の両方を許可する共通の判定を作り、ルールを書き直し。「ログイン方法を増やしたら保存まで確認」を確認リストに追加 |
| Web もアプリも開けなくなった | ホスティングの CPU 上限超過で停止（トップページを毎回作り直す設定が主な原因候補） | 有料プランで即復旧し、トップページを60秒キャッシュに変更。コストのチェックリストを作成 |
| Android で Google ログインできない（テスター報告） | ストア配布用の証明書が Firebase に未登録 | 正しい証明書を登録して再リリース |
| Android の戻るボタンでアプリが閉じる（テスター報告） | 戻る操作を受け取るプラグインがなかった | プラグインと戻る処理を追加して再リリース |
| iPhone で見出しがステータスバーと重なる | 画面の安全領域の余白がなかった | 余白を追加（TestFlight の確認で発見） |
| デッキの枚数上限が画面上だけ | サーバー側のルールで制限していなかった | Firestore のルール側でも上限を強制 |

App Store 審査では Apple から3回の連絡（情報の追加・ログインボタンのロゴ・利用規約とユーザー投稿の安全対策）があり、修正と英語での説明・実機の画面録画を提出して通過しました。

## 進め方

- 実装には AI コーディングツール（Claude Code）を使っています。要件整理・コード差分の確認・実機での動作確認・不具合の原因調査・リリース判断は自分で行っています。
- 主な修正・機能はブランチを作り、Pull Request でまとめてから本番に反映しています。
- 自動テストはまだありません。過去の不具合をもとにした手動の確認リストでリリース前に確認しています。

## ドキュメント

| ファイル | 内容 |
|---|---|
| [architecture/ARCHITECTURE.md](architecture/ARCHITECTURE.md) | 全体構成、Web とモバイルの関係 |
| [security/AUTH_AND_FIRESTORE.md](security/AUTH_AND_FIRESTORE.md) | 認証と Firestore セキュリティの構成 |
| [operations/RELEASE_CHECKLIST.md](operations/RELEASE_CHECKLIST.md) | リリース前チェックリスト |
| [operations/INCIDENTS.md](operations/INCIDENTS.md) | 障害の記録と再発防止 |
| [operations/COST_GUARDRAILS.md](operations/COST_GUARDRAILS.md) | コスト・可用性のルール |
| [testing/REGRESSION_CHECKLIST.md](testing/REGRESSION_CHECKLIST.md) | 回帰確認チェックリスト |
| [knowledge/LEARNINGS.md](knowledge/LEARNINGS.md) | 開発で得た知見 |

## ローカルでの起動

```bash
npm install
npm run dev
```

`.env.local` に Firebase の Web アプリ設定（`NEXT_PUBLIC_FIREBASE_API_KEY`・`NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`・`NEXT_PUBLIC_FIREBASE_PROJECT_ID`・`NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`・`NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`・`NEXT_PUBLIC_FIREBASE_APP_ID`）と `NEXT_PUBLIC_SITE_URL` を設定してから起動します（`NEXT_PUBLIC_GA_ID` は任意）。http://localhost:3000 で開きます。
