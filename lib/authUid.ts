// 自分のコメントだけを安全に削除できるようにするためのID。
// ログイン画面は一切出さず、裏でFirebaseの匿名認証にサインインして、
// なりすましできない(Firestoreルール側で検証できる)IDを1つ持たせる。
// 「投稿者/コメントした人」の判定(通知バッジ用)は引き続きlib/deviceId.tsの
// localStorage IDを使う。こちらは「自分のコメントを削除してよいか」の判定専用。
import { signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

let authUidPromise: Promise<string> | null = null;

/**
 * 今のログイン中ユーザーのUIDを返す(未サインインなら裏で匿名サインインしてから返す)。サーバー側では空文字を返す。
 * 結果をモジュール内に使い回さない: ログアウト/アカウント削除→別アカウントでログイン、をページ再読み込み無しで
 * 行うと古いUIDが残り、コメントの authorUid が request.auth.uid と食い違って送信が拒否されるため。
 */
export function ensureAuthUid(): Promise<string> {
  if (typeof window === "undefined") return Promise.resolve("");
  if (auth.currentUser) return Promise.resolve(auth.currentUser.uid);

  if (!authUidPromise) {
    authUidPromise = new Promise<string>((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          unsubscribe();
          resolve(user.uid);
        }
      });
      signInAnonymously(auth).catch(() => {
        unsubscribe();
        resolve("");
      });
    }).finally(() => {
      authUidPromise = null;
    });
  }
  return authUidPromise;
}

/** 今分かっている範囲でのUIDを同期的に返す(サインイン前ならnull) */
export function getKnownAuthUid(): string | null {
  return auth.currentUser?.uid ?? null;
}
