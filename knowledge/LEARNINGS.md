# Pocket Base 長期知識（Learnings）

最終更新: 2026-10-02

分類: **CONFIRMED**（実インシデント・実コードで確認済み）/ **PROMISING**（有望だが未検証）/ **TESTING**（検証中）/ **INVALIDATED**（試したが否定された）

過去のインシデント・調査結果から、再発防止・意思決定に価値のあるものだけをCONFIRMEDとして登録する。
推測や未確認の仮説をCONFIRMEDに混ぜないこと。

---

## CONFIRMED

### L-001: Capacitor server.url構成では、Web可用性がモバイル可用性を決定する

- **Date**: 2026-10-02に実証（それ以前から構成上の事実ではあった）
- **Context**: `capacitor.config.ts`の`server.url`が本番Vercel URLを直接指しており、Android/iOSアプリはネイティブの独自画面を持たない
- **Evidence**: 2026-10-02、VercelのCPU使用量超過でアカウント全体が一時停止した際、ネイティブ側のコードには一切変更が無いにもかかわらずAndroid/iOS双方で「アプリが開けない」症状が発生した
- **Related Incident**: [[../operations/INCIDENTS.md]] INC-004
- **Related Files**: `capacitor.config.ts`, [[../architecture/ARCHITECTURE.md]]
- **Confidence**: 確定
- **Action**: Web側の変更・障害調査を行う際は、常に「これはモバイルにも波及するか」を前提に考える。[[../operations/COST_GUARDRAILS.md]]のチェックリストを徹底する

### L-002: 認証プロバイダ変更時は、Firestoreルールまで必ず回帰確認する

- **Date**: 2026-09-29
- **Context**: Apple Sign-Inを追加した際、アプリコード側の実装は正しく動作していたが、Firestoreセキュリティルール側の「ログイン済み判定」がGoogleのみを対象にしており、Apple認証ユーザーのアカウント機能が全滅していた
- **Evidence**: `firestore.rules`の修正前後の差分（`isVerifiedSignIn()`ヘルパー導入でGoogle/Apple両対応に）
- **Related Incident**: [[../operations/INCIDENTS.md]] INC-003
- **Related Files**: `firestore.rules`, [[../security/AUTH_AND_FIRESTORE.md]]
- **Confidence**: 確定
- **Action**: 認証プロバイダの追加・変更は、[[../security/AUTH_AND_FIRESTORE.md]]のチェックリストに従い、ログイン成功の確認だけでなく、ログイン後のFirestore操作まで実際に試す

### L-003: Android向けFirebase OAuth設定は、アップロード鍵ではなく実際の配布証明書のSHA-1を使う

- **Date**: 2026-09-29頃
- **Context**: Google Play App Signingは開発者のアップロード鍵とは別の証明書でアプリを再署名して配布する。Firebaseにはこの実際の配布用証明書のSHA-1を登録する必要がある
- **Evidence**: 誤った証明書（デバッグ/アップロード鍵）のSHA-1しか登録されていなかったため、実機でのGoogle Sign-Inが機能しなかった事象と、Play Console「Play アプリ署名の管理」から正しい証明書を取得して解決した事実
- **Related Incident**: [[../operations/INCIDENTS.md]] INC-001
- **Related Files**: `android/app/google-services.json`
- **Confidence**: 確定
- **Action**: Android向けのFirebase/Google連携設定を行う際は、Play Console側の「Play アプリ署名の管理」から実際の配布証明書のハッシュを取得する。新しい署名鍵を追加した場合は`google-services.json`の再ダウンロードを忘れない

### L-004: Capacitorアプリは戻るボタン対応を明示的に実装しないと、アプリごと終了する

- **Date**: 2026-09-30
- **Context**: SPA（Next.js）のクライアントサイドページ遷移は、WebViewの「戻る」履歴として自動では認識されない
- **Evidence**: `@capacitor/app`未導入の状態で、戻るボタンを押すとページ内遷移ではなくアプリ終了が発生していた事象と、プラグイン導入+`NativeBackButton.tsx`実装で解決した事実
- **Related Incident**: [[../operations/INCIDENTS.md]] INC-002
- **Related Files**: `components/NativeBackButton.tsx`
- **Confidence**: 確定
- **Action**: Capacitorアプリでクライアントサイドルーティングを使う場合、`@capacitor/app`のbackButtonリスナーは初期実装時点で必須と考える

### L-005: 動的レンダリング（force-dynamic）は、少数の「鮮度が必要な値」のためにページ全体のキャッシュを犠牲にしてしまう

- **Date**: 2026-10-02
- **Context**: ホームページ全体が、トレード投稿数というごく一部の値をFirestoreから最新取得するためだけに`force-dynamic`化されており、アクセスのたびにCDNキャッシュなしでフルレンダリングされていた
- **Evidence**: VercelのFluid Active CPU使用量がHobbyプラン上限（月4時間相当）の4倍超（16時間超）に達し、アカウント全体が一時停止した事実。`revalidate = 60`への変更で同等の「ほぼ最新」の表示を保ちながらキャッシュを有効化できた
- **Related Incident**: [[../operations/INCIDENTS.md]] INC-004
- **Related Files**: `app/page.tsx`, [[../operations/COST_GUARDRAILS.md]]
- **Confidence**: 確定
- **Action**: 「一部の値だけ最新であってほしい」という要求に対しては、ページ全体の`force-dynamic`ではなく、短い`revalidate`間隔のISR、またはクライアントサイドでの個別フェッチを優先的に検討する

---

## PROMISING

(現時点で登録なし。今後、十分な検証が無いまま採用した設計判断等があればここに追記する)

## TESTING

(現時点で登録なし)

## INVALIDATED

### L-X01: 日本語カード画像の公開データソースは存在しない（2026年9月時点）

- **Date**: 2026-09-14頃調査
- **Context**: 日本語カード画像対応の要望に対し、TCGdex・Vociferix/ptcgp-images・hugoburguete・flibustier等4候補を調査
- **Evidence**: いずれも日本語版ポケポケカード画像は提供しておらず（flibustierはREADME上「対応予定」の未着手項目だった）、実装は見送りとなった
- **Related Files**: [`project_pokepoke_ja_card_images_research.md`（ユーザーメモリ）]
- **Confidence**: 2026年9月時点の調査結果。将来新しいデータソースが登場している可能性はあるため、話題が再浮上した場合は再調査から始めず、まずこの調査結果を出発点にする
- **Action**: 今後「日本語カード画像」の相談があれば、まずこのLearningを参照し、同じ4候補の再調査を繰り返さない
