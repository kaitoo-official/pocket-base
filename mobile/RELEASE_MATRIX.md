# プラットフォーム別リリース状況マトリクス

最終更新: 2026-10-02

## Web

| 項目 | 内容 |
|---|---|
| Build method | Next.js App Router、Vercelへのpush時自動デプロイ |
| Auth | Firebase Authentication（Google/Apple/匿名） |
| Distribution | https://pocket-base-delta.vercel.app （Vercel Proプラン） |
| Current status | **Production**（一般公開中） |
| Next action | [[../operations/COST_GUARDRAILS.md]]に基づくCPU使用量の継続監視。他ページのキャッシュ戦略見直し検討 |
| Dependencies | Firebase Auth/Firestore、`pokemon-tcg-pocket-cards`パッケージ |
| Known risks | サーバーサイド処理の追加がVercel CPU使用量を押し上げるリスク（[[../operations/INCIDENTS.md]]のINC-004で実際に発生） |

## Android

| 項目 | 内容 |
|---|---|
| Build method | Capacitor（`android/`）。ローカル/Windows環境でGradleビルド、署名は`android/keystore.properties`+アップロード鍵 |
| Auth | `@capacitor-firebase/authentication`経由のネイティブGoogleログイン（Apple未対応、Android版はGoogleへ直行する仕様） |
| Distribution | Google Play Console（クローズドテストトラック） |
| Current status | **クローズドテスト運用中**。Discord「Androidクローズドテスト攻略組」経由でテスター募集中。実テスターからの不具合報告2件（Google Sign-In、戻るボタン）は修正・リリース済み（versionCode 6 / versionName 1.5が最新確認版） |
| Next action | クローズドテスト要件（12人以上のテスター・14日間継続）の達成状況確認 → 本番公開への移行判断 |
| Dependencies | Google Play App Signing証明書とFirebase側SHA-1登録の一致（[[../operations/INCIDENTS.md]]のINC-001）、`@capacitor/app`（戻るボタン対応） |
| Known risks | Play App Signingの証明書更新時に再度Google Sign-Inが壊れる可能性。Web側の障害がそのままアプリの障害になる（`server.url`方式） |

## iOS

| 項目 | 内容 |
|---|---|
| Build method | Capacitor（`ios/`）をCodemagic（クラウドMac、`codemagic.yaml`の`ios-testflight`ワークフロー）でビルド・署名。手元のMac（旧機種）では最新Xcode要件を満たせないための回避策 |
| Auth | ネイティブApple Sign-In（`FirebaseAuthentication.signInWithApple()`）+ Googleログイン（iOS/Webは選択シート表示） |
| Distribution | App Store Connect（アプリID 6817170301、バージョン1.0） |
| Current status | **Build ready / submission pending** — Codemagicでのビルド・App Store Connectへのアップロードまでは成功実績あり（`submit_to_testflight: false`のため審査提出は手動）。審査用スクリーンショット・申請文面は下書き済み（[`app-store-connect-draft.md`](../app-store-connect-draft.md)）。**TestFlight配信・App Store審査提出は未実施** |
| Next action | App Store Connectでのプライバシー申告入力 → TestFlight内部テスト確認 → 審査提出（Human承認必須） |
| Dependencies | Apple Developer Program（年次更新）、Codemagicの`pocket-base-asc` App Store Connect API連携、`ios_signing`変数グループ |
| Known risks | App IDへの機能追加（Sign In with Apple等）でプロビジョニングプロファイルが無効化され、次回ビルドでの自動再作成に依存する構成になっている点。iPhone専用設定（`TARGETED_DEVICE_FAMILY = "1"`）のため、iPad非対応である点を審査メモ・ストア掲載情報と一致させる必要がある |

---

## 共通の重要事項

- 3プラットフォームとも、アプリが表示する実体は**単一の本番Webサイト**（Capacitor `server.url`方式）。Web側の変更・障害は即座に全プラットフォームへ波及する（[[../architecture/ARCHITECTURE.md]]参照）
- 公開系操作（Google Play公開、App Store/TestFlight提出）はすべてHuman承認必須
