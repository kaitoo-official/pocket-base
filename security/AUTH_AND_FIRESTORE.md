# 認証・Firestoreセキュリティ構成

最終更新: 2026-10-02（`lib/auth/googleAuth.ts`, `lib/auth/AuthProvider.tsx`, `firestore.rules`を実際に確認して記載）

## 認証プロバイダ構成

Pocket Baseは3種類のFirebase Authentication状態を持つ:

1. **匿名認証（Anonymous）**
   - `lib/authUid.ts`がゲスト状態で裏で自動的に`signInAnonymously`を行う
   - 目的: ログインしていないユーザーが投稿したコメント等の「本人確認用UID」を発行するため（削除権限の判定に使う）
   - `isVerifiedSignIn()`の対象には**含まれない**（匿名のままではログイン必須機能は使えない）

2. **Google（`google.com`）**
   - Web: `signInWithPopup`（ブロック時は`signInWithRedirect`にフォールバック）
   - ネイティブ（Android/iOS）: `@capacitor-firebase/authentication`のネイティブログイン画面を使い、取得したIDトークンをFirebase JS SDKに渡して状態を一本化（`skipNativeAuth: true`設定、`capacitor.config.ts`）
   - Androidアプリでは`useAuth().signIn()`が自動的にGoogleへ直行する（選択シートを出さない）

3. **Apple（`apple.com`）**
   - Web: `signInWithPopup`（`OAuthProvider("apple.com")`）
   - iOSネイティブ: `FirebaseAuthentication.signInWithApple()`でネイティブダイアログを表示し、IDトークン+nonceをFirebase JS SDKに渡す
   - iOS/Webでは`useAuth().signIn()`が「Appleでサインイン/Googleでログイン」の選択シート（`components/AuthSignInSheet.tsx`）を表示する

### 匿名→本ログインへのデータ引き継ぎ（重要な非自明仕様）

`lib/auth/googleAuth.ts`の`signInOrLinkWithCredential`で、ログイン時に現在のユーザーが匿名なら
**サインインではなく「匿名アカウントへのリンク」**を試みる。これにより同じUIDが維持され、ゲスト時に
付けたコメント等の所有権がそのまま引き継がれる。既に別デバイス等でそのアカウントが使用済みで
リンクできない場合のみ、通常のサインインにフォールバックする（この場合、匿名時代のデータ引き継ぎは
行われない仕様）。

## Firestoreアクセス制御の要点（`firestore.rules`）

共通ヘルパー:

```
function isVerifiedSignIn() {
  return request.auth != null
    && (request.auth.token.firebase.sign_in_provider == 'google.com'
      || request.auth.token.firebase.sign_in_provider == 'apple.com');
}
```

| コレクション | 読み取り | 書き込み | 備考 |
|---|---|---|---|
| `users/{userId}` | 本人のみ | `isVerifiedSignIn()`かつ本人。**削除も本人のみ可**(アカウント削除機能用、2026-10-04追加) | プロフィール。`provider`は`google`/`apple`のみ許可。削除ルールを変えるときは`lib/auth/deleteAccount.ts`も確認すること |
| `users/{userId}/wishlist/{cardId}` | 本人のみ | `isVerifiedSignIn()`かつ本人 | ほしいリスト。匿名は不可 |
| `users/{userId}/collection/{cardId}` | 本人のみ | `isVerifiedSignIn()`かつ本人 | 所持枚数は1〜3（3=3枚以上扱い）。0枚に戻す時はドキュメント削除 |
| `users/{userId}/decks/{deckId}` | 本人のみ | `isVerifiedSignIn()`かつ本人 | `deckId`は`slot-0`/`slot-1`/`slot-2`のみ許可（＝無料枠3デッキ制限をルール側でも強制） |
| `tradePosts/{postId}` | 誰でも | 新規作成は`isVerifiedSignIn()`必須。更新は投稿者本人、またはコメント件数カウンタのみの更新 | 既存の匿名投稿（`userId`無し）は読み取り専用のまま残る |
| `tradePosts/{postId}/comments/{commentId}` | 誰でも | **作成は`isVerifiedSignIn()`必須**（閲覧はログイン不要）。`memo`/`text`/`nickname`はURL混入を拒否(`hasNoUrl()`) | ログイン必須化は2026-09-29に追加された機能。削除は`authorUid`本人のみ |
| `reports/{reportId}` | 通報した本人のみ | `isVerifiedSignIn()`必須。`reportId`を`{reporterUid}_{targetType}_{targetId}`形式に固定し二重通報を防止 | **未デプロイ**(`feat/ugc-safety`、2026-10-02時点)。UGC通報機能用。更新・削除は不可 |
| `users/{userId}/blockedUsers/{blockedUid}` | 本人のみ | `isVerifiedSignIn()`かつ本人。`blockedUid != userId`（自己ブロック不可） | **未デプロイ**(`feat/ugc-safety`、2026-10-02時点)。UGCブロック機能用 |
| `feedback/{feedbackId}` | 不可（運営がConsoleで直接確認） | 誰でも作成可（バリデーションあり） | 公開掲示板ではないため読み取り不可 |

## Firestoreルールのデプロイ方法（重要）

**このリポジトリにはFirebase CLIの設定ファイル（`firebase.json`・`.firebaserc`）が存在せず、
`firebase-tools`もCI/CDも導入されていない。** `firestore.rules`を変更しても、**Vercelへのデプロイだけでは
本番Firestoreのルールは一切更新されない**（WebアプリのコードとFirestoreのルールは完全に別系統のデプロイ）。

過去の実績（[[../operations/INCIDENTS.md]]のINC-003）でも、ルール変更は**Firebase Consoleの
「Firestore Database」→「ルール」タブに`firestore.rules`の内容を直接貼り付けて「公開」する手動デプロイ**
で行われている。この運用は本件（UGC安全機能）でも変わらない。

### Production反映時の安全な順序

1. **`firestore.rules`をFirebase Consoleへ貼り付けて先に反映する**（下記「デプロイ前の検証」を済ませてから）
2. 公開後、Firebase Console上でルールが正しく反映されたことを確認する（「公開済み」の日時が更新されているか等）
3. Webアプリ（Vercel）側の変更を反映する
4. Production環境で[[../testing/UGC_SAFETY_QA.md]]の2アカウントQAを実施する

**順序が重要な理由**: 先にWebアプリ（新しいクライアントコード）だけを公開すると、まだ存在しない
`reports`/`blockedUsers`コレクションへの読み書きが本番ユーザーに対して`permission-denied`を返し続ける
（詳細は[[../operations/MODERATION.md]]のPERMISSION DENIED ROOT CAUSE相当の現象）。影響は「通報・ブロックが
使えないだけ」でアプリ全体は壊れないが、順序を守ることで無駄なエラーログ・ユーザー体験の悪化を避けられる。

### デプロイ前の検証（Rules Playground、追加の依存関係なし）

このリポジトリには`firebase-tools`も自動テストの仕組みも無いため、厳密な自動テスト
（`@firebase/rules-unit-testing`等）を今すぐ使うには新規依存関係の追加が必要になる。
**まずは追加の依存関係が不要な方法**として、Firebase Consoleの「ルール」タブ内にある
**「Rules Playground」**（公開前のルール案に対してシミュレーションのread/write/updateリクエストを
試せる機能）を使った手動検証を推奨する。具体的なテストケースは[[../operations/MODERATION.md]]参照。

自動テストの仕組みを今後整備したい場合は、`firebase-tools`＋`@firebase/rules-unit-testing`を
devDependenciesに追加する案がある（要Human確認。今回のスコープでは追加していない）。

## 認証プロバイダ追加・変更時のチェックリスト（必須）

**[[../operations/INCIDENTS.md]]のINC-003（Apple Sign-In導入時にFirestoreルールの更新漏れでアカウント機能が
全滅した事故）を踏まえ、認証プロバイダに関わる変更をする際は必ず以下を確認すること。**

- [ ] 新しい/変更したプロバイダの`sign_in_provider`文字列を正確に把握した（例: `google.com`, `apple.com`）
- [ ] `firestore.rules`の`isVerifiedSignIn()`（またはそれに相当するチェック）の対象に、新しいプロバイダが含まれているか確認した
- [ ] `users`/`wishlist`/`collection`/`decks`/`tradePosts`/`comments`の**すべて**で回帰確認した（1箇所だけ直して満足しない）
- [ ] 匿名アカウントからのリンク（`linkWithCredential`/`linkWithPopup`）が新しいプロバイダでも動作するか確認した
- [ ] ログアウト処理が正しく全プロバイダの状態をクリアするか確認した
- [ ] 実際にそのプロバイダでログインした状態で、ほしいリスト・マイコレクション・マイデッキ・トレード投稿・コメント投稿を**実際に試す**（ログイン成功の見た目だけでは不十分。INC-003はまさにこのパターンで見逃された）
- [ ] `firestore.rules`のデプロイはHuman承認後に実行する

## 関連ドキュメント

- [[../operations/INCIDENTS.md]] — INC-003（Apple Sign-In×Firestoreルール事故）
- [[../testing/REGRESSION_CHECKLIST.md]] — AUTH項目
- [[../operations/RELEASE_CHECKLIST.md]] — AUTH/FIRESTORE項目
