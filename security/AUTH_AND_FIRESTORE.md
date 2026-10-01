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
| `users/{userId}` | 本人のみ | `isVerifiedSignIn()`かつ本人 | プロフィール。`provider`は`google`/`apple`のみ許可 |
| `users/{userId}/wishlist/{cardId}` | 本人のみ | `isVerifiedSignIn()`かつ本人 | ほしいリスト。匿名は不可 |
| `users/{userId}/collection/{cardId}` | 本人のみ | `isVerifiedSignIn()`かつ本人 | 所持枚数は1〜3（3=3枚以上扱い）。0枚に戻す時はドキュメント削除 |
| `users/{userId}/decks/{deckId}` | 本人のみ | `isVerifiedSignIn()`かつ本人 | `deckId`は`slot-0`/`slot-1`/`slot-2`のみ許可（＝無料枠3デッキ制限をルール側でも強制） |
| `tradePosts/{postId}` | 誰でも | 新規作成は`isVerifiedSignIn()`必須。更新は投稿者本人、またはコメント件数カウンタのみの更新 | 既存の匿名投稿（`userId`無し）は読み取り専用のまま残る |
| `tradePosts/{postId}/comments/{commentId}` | 誰でも | **作成は`isVerifiedSignIn()`必須**（閲覧はログイン不要） | ログイン必須化は2026-09-29に追加された機能。削除は`authorUid`本人のみ |
| `feedback/{feedbackId}` | 不可（運営がConsoleで直接確認） | 誰でも作成可（バリデーションあり） | 公開掲示板ではないため読み取り不可 |

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
