# リリース前チェックリスト

最終更新: 2026-10-02

本番公開・ストア提出に関わる作業（Vercel本番デプロイの確認、Google Play公開、App Store/TestFlight提出、
Firestoreルールのデプロイ等）は、**必ず人間（ユーザー）の承認を得てから実行する。** このチェックリストは
その承認判断と作業漏れ防止のために使う。

## WEB

- [ ] `npm run build`がローカルで成功する
- [ ] `npm run lint`でエラーが出ていない
- [ ] 主要ルート（ホーム・カード検索・カード詳細・パック一覧・トレード掲示板・マイページ）が実際にブラウザで表示できる
- [ ] ログイン（Google/Apple/匿名）とログアウトが正常に動作する
- [ ] Firestoreへの読み書きが必要な機能（ほしいリスト・マイコレクション・マイデッキ・トレード投稿・コメント）が正常に動作する
- [ ] 新規・変更したルートについて、[[COST_GUARDRAILS.md]]のチェックリストでCPU/レンダリング方式への影響を確認した
- [ ] 本番デプロイ後、実際の本番URL（https://pocket-base-delta.vercel.app）でスモークテストを行った

## ANDROID

- [ ] `android/app/build.gradle`の`versionCode`をインクリメントした（Play Consoleは同じversionCodeを受け付けない）
- [ ] `versionName`を更新した
- [ ] Google Sign-Inが実機（可能ならPlay App Signingで署名された実際の配布ビルド）で動作する（[[INCIDENTS.md]]のINC-001参照）
- [ ] 端末の戻るボタンが正しく動作する（アプリが即終了しない）（[[INCIDENTS.md]]のINC-002参照）
- [ ] 起動スプラッシュ画面が意図した見た目で表示される
- [ ] `android/app/google-services.json`が最新（Firebase側の設定変更があった場合は再ダウンロード済みか確認）
- [ ] 署名済みAAB/APKをビルドし、Play Consoleにアップロードした
- [ ] リリースノートを記入した
- [ ] **公開操作自体はHuman承認後に実行する**

## iOS

- [ ] Apple Sign-Inが動作する（ログイン・ゲストからのアカウント引き継ぎ含む）
- [ ] Googleログインが退行していないか確認した
- [ ] Firebase設定（`GoogleService-Info.plist`等）が最新
- [ ] Codemagicの`ios-testflight`ワークフローがビルド成功している（証明書・プロビジョニングプロファイルの再作成ステップ含む）
- [ ] Bundle ID（`com.kaitooofficial.pocketbase`）が一致している
- [ ] ビルド番号が前回提出分より新しい
- [ ] TestFlightへのアップロードが完了し、内部テスターで動作確認した
- [ ] スクリーンショット（iPhone各サイズ）が最新のUIを反映している
- [ ] App Store Connectのプライバシー申告（App Privacy）が実際の収集データ（氏名・メールアドレス等）と一致している
- [ ] 審査メモにネイティブ機能（下タブバー、ネイティブログイン等）の説明を記載した（ガイドライン4.2対策）
- [ ] **TestFlight外部配信・App Store審査提出はHuman承認後に実行する**（現状`submit_to_testflight: false`でアップロードのみ自動化、審査提出は手動）

## AUTH

- [ ] 認証プロバイダ（Google/Apple/匿名）を追加・変更した場合、[[../security/AUTH_AND_FIRESTORE.md]]のチェックリストをすべて実施した
- [ ] 匿名アカウントからのリンク（ゲストデータ引き継ぎ）が正常に動作する

## FIRESTORE

- [ ] `firestore.rules`の変更内容をローカルで読み合わせ、意図しない権限拡大が無いか確認した
- [ ] 認証プロバイダ変更時は`isVerifiedSignIn()`等のヘルパー関数の対象に漏れがないか確認した（[[INCIDENTS.md]]のINC-003の再発防止）
- [ ] **ルールのデプロイ（Firebase Console/CLI）はHuman承認後に実行する**

## PRODUCTION（公開直前の最終確認）

- [ ] 上記WEB/ANDROID/iOS/AUTH/FIRESTOREのうち関係する項目をすべて満たしている
- [ ] QA（`qa-security`）による回帰確認（[[../testing/REGRESSION_CHECKLIST.md]]）を実施した。**「ビルド成功」はQA成功を意味しない**
- [ ] 公開後の監視体制（[[COST_GUARDRAILS.md]]の監視の習慣）を確認した
- [ ] 公開系の操作（Vercelプラン変更、Play Console公開、App Store/TestFlight提出、Firestoreルールデプロイ、認証情報変更、DNS、有料サービス変更、破壊的DB操作）はすべてHuman承認を得てから実行した
