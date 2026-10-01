# Pocket Base インシデント記録

最終更新: 2026-10-02

過去に実際に発生した本番障害・重大バグを再利用可能な形で記録する。推測は事実として書かない。
確認できていない点は「未確認」と明記する。新しいインシデントが発生したら同じ書式で追記すること。

---

## INC-001: Android版 Google Sign-Inが機能しない

- **Date**: 発見・修正 2026-09-29頃（クローズドテスターからの実報告）
- **Impact**: Android版アプリでGoogleログインを試みたユーザーがログインできない
- **Symptoms**: ログインボタンを押しても反応がない／ログインが完了しない
- **Root Cause**: Google Play App Signingによりストア配布用APKは開発者のアップロード鍵とは別の証明書で再署名される。その**実際の配布用証明書のSHA-1**がFirebaseに登録されていなかった（Firebaseには別の証明書のハッシュしか登録されていなかった）ため、Google側の認証リクエストが正しいアプリとして認識されなかった
- **Fix**: Play Console「Play アプリ署名の管理」から実際の配布用証明書をダウンロードしSHA-1/SHA-256を取得 → Firebase Consoleに登録 → `android/app/google-services.json`を再ダウンロードして置き換え → versionCode 5 (1.4) としてリリース
- **Prevention**: Android向けにFirebase連携のOAuthクライアントを設定する際は、**アップロード鍵ではなく実際の配布（Play App Signing）証明書のSHA-1を必ず使う**。新しい署名鍵を追加・変更した場合は`google-services.json`の再ダウンロードを忘れない
- **Related Files**: `android/app/google-services.json`, `android/app/build.gradle`
- **Status**: Resolved（公開確認済み）

---

## INC-002: Android端末の戻るボタンでアプリが即終了する

- **Date**: 発見・修正 2026-09-30頃（クローズドテスターからの実報告）
- **Impact**: Android版アプリでハードウェア戻るボタンを押すと、ページ内を戻る代わりにアプリ自体が終了してしまう
- **Symptoms**: カード詳細等のページから戻るボタンを押すと、ホームに戻らずアプリがバックグラウンドに落ちる（実質終了したように見える）
- **Root Cause**: `@capacitor/app`プラグインが導入されておらず、Next.jsのクライアント側ページ遷移（`history.pushState`）がWebViewの「戻る」履歴として認識されていなかった。Android標準動作では、戻る履歴が無いWebViewで戻るボタンを押すと即座にアプリ終了として扱われる
- **Fix**: `@capacitor/app`パッケージを追加し、`components/NativeBackButton.tsx`を新規実装。`App.addListener("backButton", ...)`で`canGoBack`を見て、履歴があれば`window.history.back()`、無ければ`App.exitApp()`を呼ぶように変更 → versionCode 6 (1.5) としてリリース
- **Prevention**: Capacitorアプリではブラウザの「戻る」操作は自動では機能しない。ネイティブの戻るボタン・スワイプバックに対応する処理は、SPAのページ遷移を導入した時点で必ずセットで実装する
- **Related Files**: `components/NativeBackButton.tsx`, `app/layout.tsx`, `package.json`
- **Status**: Resolved（公開確認済み）

---

## INC-003: Apple Sign-In導入後、Apple認証ユーザーがアカウント機能を一切使えない

- **Date**: 発見・修正 2026-09-29（Apple Sign-In実装中に発見）
- **Impact**: Apple IDでログインしたユーザーが、ほしいリスト・マイコレクション・マイデッキ・トレード投稿等、ログインが必要な機能をすべて利用できない（重大）
- **Symptoms**: Appleでログイン自体は成功するが、その後のFirestore読み書きがすべて権限エラーになる
- **Root Cause**: `firestore.rules`のログイン済み判定が`request.auth.token.firebase.sign_in_provider == 'google.com'`のみをチェックしており、Apple Sign-Inを追加した際にルール側の更新が漏れていた
- **Fix**: `isVerifiedSignIn()`ヘルパー関数を導入し、`sign_in_provider`が`google.com`または`apple.com`のいずれかであればログイン済みとして扱うようにルール全体（users/wishlist/collection/decks/tradePosts/comments）を修正。Firebase Consoleから`firestore.rules`を再デプロイ
- **Prevention**: **新しい認証プロバイダを追加する際は、必ずFirestoreセキュリティルールの回帰確認をセットで行う。** アプリコードのテストだけでは発見できない（ログイン自体は成功して見えるため）。詳細チェックリストは[[../security/AUTH_AND_FIRESTORE.md]]参照
- **Related Files**: `firestore.rules`, `lib/auth/googleAuth.ts`, `lib/users.ts`
- **Status**: Resolved（デプロイ・動作確認済み）

---

## INC-004: Vercelアカウント一時停止によるWeb/Android/iOS全停止

- **Date**: 発見・対応 2026-10-02
- **Impact**: 本番サイト（Web）が「Deployment Paused」表示になり閲覧不可。Capacitorの`server.url`方式のため、Android/iOSアプリも連動して「開けない」状態になった（[[../architecture/ARCHITECTURE.md]]の「Web可用性=モバイル可用性」参照）
- **Symptoms**: ユーザーから「アプリ自体が開けない」との報告。調査の結果、本番URLに直接アクセスしても「Deployment Paused」ページが表示されることを確認
- **Root Cause**: VercelのHobby（無料）プランの「Fluid Active CPU」使用量上限（過去30日間ローリング集計で4時間まで）を大幅に超過（実測16時間18分）し、アカウント配下の全プロジェクト（kaitoo-works・pocket-base）のデプロイが自動停止された。超過の主因候補として、ホームページ（`app/page.tsx`）が`export const dynamic = "force-dynamic"`設定になっており、トレード投稿数をFirestoreから最新表示するためにアクセスのたびにCDNキャッシュなしでサーバー側フルレンダリングされていたことが挙げられる（断定はできないが、コード上の作りとして最も疑わしい要因）。この状態でDiscordでのテスター募集によるアクセス増加が重なったと推測される
- **Fix**:
  1. 応急対応: Vercel Proプラン（月$20）へアップグレードし即座に復旧
  2. 根本対応: `app/page.tsx`の`export const dynamic = "force-dynamic"`を`export const revalidate = 60`（60秒間隔のISR）に変更し、ほとんどのアクセスをCDNキャッシュから返すようにした
- **Prevention**: [[COST_GUARDRAILS.md]]のチェックリストを、動的レンダリング・サーバーサイドFirestoreクエリを追加する前に必ず確認する運用とする
- **Related Files**: `app/page.tsx`, [`vercel-pause-incident-2026-10-02.md`](../vercel-pause-incident-2026-10-02.md)（当日の詳細記録）
- **Status**: Resolved（復旧・修正・デプロイ済み。ただし他ページへの同様の見直しは未実施＝FOLLOW-UP）
