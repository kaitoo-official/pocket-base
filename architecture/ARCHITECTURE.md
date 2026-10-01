# Pocket Base アーキテクチャ

最終更新: 2026-10-02（実コード・設定ファイルを確認した上で記載）

このドキュメントはPocket Baseの技術構成と、各コンポーネント間の依存関係を整理したものです。
特に「Web側の障害がそのままモバイルアプリの障害になる」という構造上の制約を全エンジニアが前提として持つことを目的とします。

## 全体構成

```
                         ┌─────────────────────────┐
                         │   外部データソース          │
                         │ pokemon-tcg-pocket-cards │
                         │   v5 (collection /       │
                         │   gameplay / expansions) │
                         │   + PokeAPI(日本語名)     │
                         └────────────┬─────────────┘
                                      │ ビルド時に読み込み・変換
                                      ▼
                         ┌─────────────────────────┐
                         │   lib/data.ts 他          │
                         │ (モジュール読み込み時に     │
                         │  一度だけ変換してメモリに保持)│
                         └────────────┬─────────────┘
                                      ▼
┌──────────────┐        ┌─────────────────────────┐        ┌──────────────────┐
│ Firebase     │◀──────▶│   Next.js (App Router)   │──────▶│  Vercel (Hosting) │
│ Authentication│       │  app/ components/ lib/   │        │  Proプラン運用中     │
│ Google/Apple/ │        └────────────┬─────────────┘        └─────────┬─────────┘
│ 匿名ログイン    │                     │ 読み書き                        │ 本番配信
└──────┬───────┘                     ▼                                │
       │               ┌─────────────────────────┐                   │
       └──────────────▶│      Firestore           │                   │
                        │ users/wishlist/collection│                   │
                        │ /decks/tradePosts/       │                   │
                        │ comments/feedback        │                   │
                        └─────────────────────────┘                   │
                                                                       ▼
                                                   https://pocket-base-delta.vercel.app
                                                                       │
                        ┌──────────────────────────────────────────────┤
                        │                                              │
                        ▼ Capacitor server.url                        ▼ 通常のブラウザアクセス
             ┌────────────────────┐                         （PC/スマホのWebブラウザ）
             │  Capacitorアプリ本体   │
             │ (薄いネイティブラッパー)│
             └──────────┬─────────┘
                ┌────────┴────────┐
                ▼                 ▼
      ┌──────────────────┐ ┌──────────────────┐
      │ Android           │ │ iOS               │
      │ Google Play       │ │ App Store Connect │
      │ クローズドテスト運用中 │ │ ビルド準備済み/提出前 │
      └──────────────────┘ └──────────────────┘
                │                 │
                ▼                 ▼
         Google Play Console  Codemagic(クラウドMac)
         （署名・配信管理）      でビルド・署名・アップロード
```

## コンポーネント別の役割

### 1. Webアプリ本体（Next.js App Router）
- `app/`: ページ（カード検索・詳細・パック一覧・トレード掲示板・マイページ等）
- `components/`: UIコンポーネント
- `lib/`: データ変換、認証、Firestoreアクセス、日本語マッピング等のロジック
- ホスティング: Vercel（現在Proプラン。[[../operations/COST_GUARDRAILS.md]]参照）

### 2. 外部カードデータ
- npmパッケージ`pokemon-tcg-pocket-cards`のv5系（`collection`+`gameplay/no-image`+`expansions`）
- `lib/data.ts`がモジュール読み込み時に一度だけ変換・メモリ保持（リクエストごとの再計算ではない）
- 日本語名・技効果文は`lib/data/*.json`に自前マッピングとして保持（PokeAPI・Bulbapedia姉妹wiki等から過去に生成）

### 3. 認証（Firebase Authentication）
- プロバイダ: Google / Apple / 匿名（ゲストのコメント削除用UID発行のため）
- 詳細は[[../security/AUTH_AND_FIRESTORE.md]]を参照

### 4. データベース（Firestore）
- コレクション: `users`配下に`wishlist`/`collection`/`decks`、トップレベルに`tradePosts`（`comments`サブコレクション付き）、`feedback`
- セキュリティルール: `firestore.rules`。`isVerifiedSignIn()`ヘルパーでGoogle/Apple認証済みユーザーのみ書き込み許可する箇所が多い

### 5. モバイルアプリ（Capacitor）
- `capacitor.config.ts`の`server.url`が本番Vercel URL（`https://pocket-base-delta.vercel.app`）を直接指している
- ネイティブ側（`android/`・`ios/`）はほぼ薄いラッパーで、画面の実体はWebと完全に同じ
- ネイティブ固有の実装: Googleログイン（`@capacitor-firebase/authentication`経由）、Apple Sign-In、起動スプラッシュ画面、端末の戻るボタン対応（`@capacitor/app`+`NativeBackButton.tsx`）

### 6. 配信基盤
- Android: Google Playクローズドテスト運用中。署名は`android/keystore.properties`（gitignore対象）
- iOS: Codemagic（クラウドMac）でビルド・署名・App Store Connectへのアップロードを実行（`codemagic.yaml`）。手元のMacが古くXcode最新版が使えないための回避策
- 現在のプラットフォーム別状況は[[../mobile/RELEASE_MATRIX.md]]を参照

## 最重要: Web可用性 = モバイル可用性

**Capacitorは`server.url`方式のため、ネイティブアプリは独自の画面を持たない。**
Androidアプリ・iOSアプリが表示しているのは、どちらも本番Vercel URLそのものである。

このため、以下の等式が常に成り立つ:

```
Vercel / Web側の障害  =  Androidアプリの障害  =  iOSアプリの障害
```

2026-10-02に実際に発生した事象（[[../operations/INCIDENTS.md]]のINC-004参照）: Vercelアカウントが
CPU使用量超過で一時停止 → 本番サイトが「Deployment Paused」表示になる → Android/iOS両アプリが
「開けない」状態になった。ネイティブ側のコードには一切問題がなかったにもかかわらず、ユーザーからは
「アプリが開けない」というネイティブアプリの不具合に見える形で報告された。

**したがって、Web側（特にVercelの可用性・CPU使用量・Firestoreルール）の変更は、必ずモバイルへの影響も
考慮した上で行う。** `web-engineer`と`ops-reliability`が密に連携すべき領域である。

## データフロー（主な処理の流れ）

1. **カード検索・閲覧**: ユーザー → Next.jsページ（ISR/静的生成中心） → `lib/data.ts`のメモリキャッシュ済みカードデータ → 表示
2. **ログイン**: ユーザー → Firebase Authentication（Google/Apple） → `lib/auth/AuthProvider.tsx`が状態管理 → Firestoreの`users/{uid}`にプロフィール同期（`lib/users.ts`）
3. **ほしいリスト・マイコレクション・マイデッキ**: ログイン済みユーザー → Firestore読み書き（`isVerifiedSignIn()`必須）
4. **トレード掲示板**: 投稿・コメント作成はログイン必須、閲覧は誰でも可（`firestore.rules`の`tradePosts`/`comments`）
5. **ホームページのトレード件数表示**: Firestoreから件数を取得する必要があるため完全な静的化はできないが、60秒間隔のISR（`revalidate = 60`）でCPU負荷を抑えている（[[../operations/INCIDENTS.md]]のINC-004で修正済み）
