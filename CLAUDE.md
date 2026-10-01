@AGENTS.md

# プロジェクト概要（Pocket Base Engineering Studio）

ブランド名「**Pocket Base**」。Pokémon Trading Card Game Pocket（ポケポケ）の非公式カード検索・
データベースアプリ。**Web（Next.js）+ Android（Google Play）+ iOS（App Store）の3プラットフォームで
展開中**であり、単なるWeb MVPの段階は終えている。

当初のゴールだった「欲しいカードを簡単に探せる」「入手方法がすぐ分かる」に加え、現在はアカウント機能
（ほしいリスト・マイコレクション・マイデッキ）、コミュニティ機能（トレード掲示板）、ネイティブアプリ
配信までを含む。各領域の詳細・現状・過去の事故は以下のドキュメント群を参照すること。

| ドキュメント | 内容 |
|---|---|
| [architecture/ARCHITECTURE.md](architecture/ARCHITECTURE.md) | 全体構成、Web↔モバイルの依存関係 |
| [roadmap/NOW_NEXT_LATER.md](roadmap/NOW_NEXT_LATER.md) | 現在のロードマップ |
| [operations/RELEASE_CHECKLIST.md](operations/RELEASE_CHECKLIST.md) | リリース前チェックリスト |
| [operations/INCIDENTS.md](operations/INCIDENTS.md) | 過去の本番障害・重大バグの記録 |
| [operations/COST_GUARDRAILS.md](operations/COST_GUARDRAILS.md) | コスト・可用性事故の再発防止ルール |
| [security/AUTH_AND_FIRESTORE.md](security/AUTH_AND_FIRESTORE.md) | 認証・Firestoreセキュリティ構成 |
| [mobile/RELEASE_MATRIX.md](mobile/RELEASE_MATRIX.md) | Web/Android/iOSの現在状態 |
| [testing/REGRESSION_CHECKLIST.md](testing/REGRESSION_CHECKLIST.md) | 回帰確認チェックリスト |
| [knowledge/LEARNINGS.md](knowledge/LEARNINGS.md) | 長期的な技術知見 |

新しいセッション・Agentは、作業を始める前にこれらのうち関係するものに目を通すこと（特にコードを変更する
前は`ARCHITECTURE.md`と`LEARNINGS.md`、本番に関わる作業前は`RELEASE_CHECKLIST.md`）。

## 技術スタック

- Next.js（App Router）/ TypeScript / Tailwind CSS / React
- Firebase Authentication（Google / Apple / 匿名）+ Firestore
- Capacitor（Android・iOS。`server.url`方式でWebサイトをそのまま表示。詳細は`ARCHITECTURE.md`）
- ホスティング: Vercel（Proプラン） / 配信: Google Play・App Store Connect（iOSビルドはCodemagic経由）
- データソース: npmパッケージ `pokemon-tcg-pocket-cards`（v5系のみ使用。v1〜v4は使わない）

実際のバージョン番号は`package.json`を都度確認すること（本ファイルには記載しない。更新の都度ズレるため）。

## 利用する外部データ（v5のみ）

- `pokemon-tcg-pocket-cards/v5/collection` … 一覧・入手方法用のメインデータ。画像・パック・レアリティ・トレード情報など（全プリント3,879件）
- `pokemon-tcg-pocket-cards/v5/gameplay/no-image` … 技・特性・弱点・にげるエネルギー（ユニークカード2,822件）
- `pokemon-tcg-pocket-cards/v5/expansions` … パック（拡張パック）情報

補足: 当初`core`データも使う想定だったが、実装時の検証で`collection`+`gameplay`の2つだけで
必要な情報（画像・パック・技・HP等）がすべて揃うことが分かったため、`core`は不採用とした。

「絵違いカード」（例: a1-227 フシギダネ☆）は`collection`にしか存在せず`gameplay`に直接の対応データが無いが、
`collection`が持つ`alternate_versions`（同じカードの他バージョン一覧）を使って、gameplayデータを持つ
「本体」バージョンから技・HP等を借用する処理を`lib/data.ts`で行っている（全3,879件で解決できることを検証済み）。

日本語名について: このデータソースにはポケモン名・カード名・技名などの日本語表記が含まれない（英語のみ）。
ポケモン名は PokeAPI（https://pokeapi.co ）から日本語名を取得して自前のマッピング表を作成し対応する。
トレーナーズカード名は件数が少ないため手動でマッピング表を作成する。
**日本語化（ポケモン名・トレーナーズ名・技名・特性名・技/特性の効果文）はすべて完了済み**
（`lib/data/*.json`）。新しいパック追加でカードが増えた場合のみ、マッピング表の追加対応が必要になる。
日本語版のカード画像（イラスト自体）は公開データソースが存在せず見送り済み（[knowledge/LEARNINGS.md](knowledge/LEARNINGS.md)のL-X01参照）。

## UI方針

- 白〜ライトグレー背景、余白多め、カード画像を大きく・主役として表示
- スマホ優先（一覧2列、検索バーは画面上部、フィルターは下からのDrawer/Sheet）
- ポップになりすぎない、大人でも使いやすいデザイン
- eFootBase( https://efootbase.com/ )の情報設計・検索性は参考にするが、デザイン・コードはコピーしない
- ネイティブアプリ（Android/iOS）ではスプラッシュ画面はInstagram風の「背景色+小さいロゴのみ」の
  ミニマルデザインに統一（過去の試行錯誤の経緯は[[knowledge/LEARNINGS.md]]・Gitログ参照）

## 実装済み範囲（2026-10-02時点）

以前「将来機能」としていたログイン・所有カード管理・デッキ・トレード掲示板・スマホアプリは
**すべて実装済み・運用中**。現状を領域別に整理すると:

**Web（検索・閲覧）**: カード検索、複数条件フィルター、並び替え、カード一覧・詳細、入手方法表示、
パック一覧・パック別一覧、日本語化（名前・効果文とも全件）、SEO（sitemap/robots/Search Console）、
GA4計測、PWA対応

**アカウント**: Firebase認証（Google/Apple/匿名）、匿名→本登録へのデータ移行、ほしいリスト、
マイコレクション（所持枚数管理）、マイデッキ（実ゲームのルールを再現した検証付き、無料枠3デッキまで）、
マイページ、フィードバックフォーム

**コミュニティ**: トレード掲示板、コメント（投稿はログイン必須、閲覧は誰でも可）、ニックネーム表示

**Android**: Capacitorアプリ、Google Playクローズドテスト運用中、ネイティブGoogleログイン、
端末戻るボタン対応、スプラッシュ画面

**iOS**: Capacitorアプリ、ネイティブApple Sign-In、Codemagic経由のビルド、App Store Connect提出準備
（スクリーンショット・申請文面は下書き済み）、iPhone専用設定。**TestFlight配信・審査提出はまだ未完了**

現在の未完了タスク・優先順位は[roadmap/NOW_NEXT_LATER.md](roadmap/NOW_NEXT_LATER.md)、
プラットフォーム別の詳細状態は[mobile/RELEASE_MATRIX.md](mobile/RELEASE_MATRIX.md)を参照。

**将来機能（まだ着手していないもの）**: カード比較、ランキング系機能、AIデッキ提案、マネタイズ施策、
追加のアナリティクス。詳細は[roadmap/NOW_NEXT_LATER.md](roadmap/NOW_NEXT_LATER.md)のLATER参照。

## 禁止事項

- 外部データに存在しない項目を推測で作らない（不足時は必ずユーザーに説明し、追加データ案を提案する）
- 画像パスをコンポーネントに直書きしない（`lib/getCardImage.ts` 経由で取得し、差し替え可能にする）
- 必要以上のディレクトリ分割・抽象化をしない
- 大量のnpmパッケージを勝手に追加しない（追加时はパッケージ名・用途・理由を説明してから）
- サーバーサイドの動的レンダリング（`force-dynamic`等）やFirestoreへのサーバーサイド問い合わせを
  追加する前に[operations/COST_GUARDRAILS.md](operations/COST_GUARDRAILS.md)のチェックリストを確認する
  （2026-10-02にVercel CPU超過でアプリ全体が停止した実際の事故があるため）

## 外部公開アクション（Human承認必須）

以下はユーザー（Human）の明示的な承認を得てから実行する。Agentが単独で実行しない:

- Vercelのプラン変更、本番デプロイの意図的な操作
- Google Playへの公開、App Store/TestFlightへの提出
- Firebase Security Rules（`firestore.rules`）のデプロイ
- 認証情報・証明書・鍵の変更
- DNS設定の変更
- 有料サービスの契約・変更
- 破壊的なデータベース操作（削除等）

## Pocket Base Engineering Studio（Agent運用体制）

このプロジェクトでは、メインのClaude CodeセッションがDirectorとして振る舞い、必要に応じて
`.claude/agents/`配下の専門subagentに作業を割り振る運用を取る（5人、無闇に増やさない）:

1. **product-planner** — ロードマップ・優先順位・機能スコープの整理。実装コードは書かない
2. **web-engineer** — Next.js/React/TypeScript/Tailwind/Firebase JS/Firestore/SEO/キャッシュ
3. **mobile-release** — Capacitor/Android/iOS/Google Play/App Store Connect/Codemagic/署名
4. **qa-security** — 回帰テスト、Auth、Firestoreセキュリティルール、リリースQA
5. **ops-reliability** — Vercel/ホスティングコスト/CPU/キャッシュ/本番インシデント対応

通常の開発フロー: Human → Director → (必要なら)Product Planner → Web Engineer / Mobile Release →
QA Security → (必要なら)Ops Reliability → Human Review → Release。**本番に関わる変更でQAを省略しない。**

各Agentの役割・作業前に確認すべきドキュメントの詳細は`.claude/agents/`配下の各定義ファイルを参照。

## 開発の進め方

- ユーザーはNext.js初心者。専門用語は一言で説明しながら、小さなSTEPごとに進める
- 各STEPで「① 今何をするか ② なぜ必要か ③ 変更するファイル ④ 実行コマンド ⑤ 結果 ⑥ 確認ポイント」を説明する
- Git/GitHubの操作は一気に行わず、必要なタイミングで学習しながら案内する
