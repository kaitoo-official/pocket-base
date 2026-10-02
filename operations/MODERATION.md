# Pocket Base UGCモデレーション運用

最終更新: 2026-10-02

トレード掲示板(投稿・コメント・ニックネーム)のUser Generated Content(UGC)に対する、
Apple App Store Guideline 1.2対応の運用手順。専用の管理画面(Admin Dashboard)は
**今回は作成していない**(現状の投稿量・運営体制(個人運営)では過剰投資と判断。
通報件数が増えてきた場合に再検討する)。Firebase Consoleから直接確認・対応する。

---

## 1. 実装済みの安全機能

- **通報(Report)**: トレード投稿・コメントの両方に「通報する」ボタン。理由選択必須(不適切な内容/嫌がらせ・暴言/スパム/詐欺・不正な取引/個人情報/その他)、自由記述は任意(最大300文字)
- **ブロック(Block)**: 他ユーザーをブロックすると、そのユーザーの投稿・コメントが自分の画面にだけ表示されなくなる(データ自体は削除しない)。トレード投稿管理ページ(`/mypage/trades`)からブロック解除可能
- **コンテンツフィルター**: 投稿前にクライアント側で禁止語・URL混入をチェック(`lib/contentFilter.ts`)。Firestoreルール側でもURLパターンの混入は作成/更新時に拒否する(直接API呼び出しでも回避できない最終防波堤)
- **連絡導線**: トレード掲示板上部に「問題のある投稿・コメントは各投稿の『通報する』ボタンから報告できます。その他のお問い合わせはこちら」を常設し、既存のフィードバックフォームへリンク

関連ファイル: `lib/reports.ts`, `lib/blockedUsers.ts`, `lib/contentFilter.ts`,
`components/ReportModal.tsx`, `components/UserSafetyMenu.tsx`, `components/BlockedUsersSection.tsx`,
`firestore.rules`(`reports`, `users/{uid}/blockedUsers`コレクション)

---

## 2. 通報を確認する(Firebase Console)

1. [Firebase Console](https://console.firebase.google.com/) → 該当プロジェクト → Firestore Database
2. `reports`コレクションを開く。ドキュメントID形式: `{reporterUid}_{targetType}_{targetId}`
3. 各ドキュメントのフィールド:
   - `targetType`: `"tradePost"` または `"comment"`
   - `targetId`: 対象の投稿ID、またはコメントID
   - `postId`: 対象コメントの親投稿ID(`targetType`が`tradePost`の場合は`targetId`と同じ値)
   - `targetAuthorUid`: 通報対象を作成したユーザーのUID(古い匿名投稿等でnullの場合あり)
   - `reason`, `details`, `createdAt`, `status`(常に`"open"`。更新機能は未実装)

### 対象投稿・コメントを特定する
- `targetType == "tradePost"` → Firestoreの`tradePosts/{postId}`(`postId`フィールドの値)を直接開く
- `targetType == "comment"` → `tradePosts/{postId}/comments/{targetId}`を直接開く(`postId`フィールド + `targetId`フィールド)

### 問題のあるコンテンツを削除する
- Firebase Console上で該当ドキュメントを直接削除する(Admin権限はセキュリティルールを経由しないため、
  アプリ側のルール(投稿者本人のみ削除可能等)の制約を受けない)

### 問題のあるユーザーを特定する
- `targetAuthorUid`から`users/{uid}`を確認すると、ログイン方法(`provider`)・表示名等が分かる
- 現時点でアプリ側に「アカウント停止(Ban)」機能は無い。深刻なケースでは、該当ユーザーの
  投稿・コメントをFirebase Console上で個別に削除する運用とする(今後の課題。下記「将来の拡張」参照)

---

## 3. 将来の拡張(今回は実装しない。設計のみ記録)

- `reports`ドキュメントへの`reviewedAt`(確認日時)・`actionTaken`(対応内容: `"none" | "deleted" | "warned" | "banned"`)フィールド追加
- 通報件数が一定数を超えたユーザーの自動フラグ付け
- 管理者用の簡易ダッシュボード(Next.jsの管理者専用ページ、または別のBaaS管理ツール)
- Cloud Functionsによる、より高度な自動コンテンツフィルター(現状はクライアント側の語彙リストのみ)

---

## 4. デプロイ前のRulesテストケース(Rules Playground用)

`firestore.rules`をFirebase Consoleで「公開」する前に、「ルール」タブの**Rules Playground**
(公開せずにシミュレーションできる機能)で以下を確認する。デプロイ手順・順序の詳細は
[[../security/AUTH_AND_FIRESTORE.md]]の「Firestoreルールのデプロイ方法」参照。

**reports**:
- [ ] 未ログイン(認証なし)での`create`が拒否される
- [ ] `reporterUid`を自分以外のUIDにした`create`が拒否される(なりすまし防止)
- [ ] ログイン済み・正しい`reporterUid`・許可された`reason`値での`create`が許可される
- [ ] 同じ`reportId`(= 同じ対象への2回目)への`create`(実質update)が拒否される
- [ ] 他ユーザーが作成した`reports`ドキュメントへの`get`が拒否される

**users/{uid}/blockedUsers**:
- [ ] 本人以外のUIDパスへの`read`/`write`が拒否される
- [ ] `blockedUid`を自分自身のUIDにした`create`が拒否される(自己ブロック防止)
- [ ] 他ユーザーの`blockedUsers`サブコレクションへの`list`が拒否される

**tradePosts / comments**:
- [ ] 通常の投稿・コメント(URL無し)の`create`が許可される(既存仕様の回帰確認)
- [ ] `memo`/`text`/`nickname`に`http://`等のURLを含む`create`が拒否される
- [ ] 既存の`delete`(投稿者/コメント投稿者本人のみ)・`update`(投稿者本人の編集、コメント件数カウンタ更新)が
      従来通り動作する(回帰なしの確認)

---

## 5. ローカル開発時の`permission-denied`について(既知の事象)

`firestore.rules`をローカルで変更しただけでは本番Firestoreには一切反映されない
(デプロイ方法は[[../security/AUTH_AND_FIRESTORE.md]]参照)。そのため、**`reports`/`blockedUsers`の
Rulesをデプロイする前**に、ログイン済み状態で`npm run dev`のローカル環境を操作すると、
ブラウザのコンソールに以下のエラーが出ることがある:

```
@firebase/firestore: Firestore (...): Uncaught Error in snapshot listener: FirebaseError: [code=permission-denied]: Missing or insufficient permissions.
```

**原因**: `lib/blockedUsers.ts`の`subscribeToBlockedUsers`(`useBlockedUserIds`経由で`TradeBoard`/
`TradeComments`に、直接`BlockedUsersSection`に実装)が、まだ存在しない(本番未デプロイの)
`users/{uid}/blockedUsers`への読み取りリアルタイム購読(`onSnapshot`)を試みるために発生する。
Firestoreはルールに一致するパスが無い場合デフォルトで拒否するため、ローカルの`firestore.rules`ファイルに
該当ルールを書いただけでは解消しない(本番にデプロイして初めて解消する)。この購読は結果を
`useState`の初期値(空のSet)のまま保ち続けるだけなので、**アプリの他の機能やページ表示自体は壊れない**
(ブロック機能だけが「何もブロックされていない」状態として動作する)。

同様に、`lib/reports.ts`の`hasReported()`(`UserSafetyMenu`が通報メニューを開く前に「通報済みか」を
確認するために呼ぶ)も、Rules未デプロイの間は失敗し「未通報」として扱われる。この呼び出し元の
`components/UserSafetyMenu.tsx`には`.catch(() => {})`を追加し、失敗時にコンソールへ
未処理のPromise rejectionが出ないようにしている。

**対応**: Rulesをデプロイすれば自動的に解消する。コード側の追加対応は不要(上記の`.catch()`追加のみ実施済み)。

---

## 6. 既知の限界(REMAINING RISKS)

- `lib/contentFilter.ts`の禁止語チェックはクライアント側のみ(JavaScriptを改変した直接API呼び出しでは回避可能)。
  Firestoreルール側の防御はURLパターンの拒否のみに限定している(保守性とのトレードオフ)
- レート制限(過剰な連投防止)は既存のhoneypotフィールドのみで、時間ベースの投稿頻度制限は無い
  (Cloud Functions等のバックエンド追加が必要になるため、今回は見送り)
- 通報後の対応(削除・警告・アカウント停止)は現時点では完全に手動(Firebase Console経由)
