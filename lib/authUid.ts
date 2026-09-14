// 自分のコメントだけを安全に削除できるようにするためのID。
// ログイン画面は一切出さず、裏でFirebaseの匿名認証にサインインして、
// なりすましできない(Firestoreルール側で検証できる)IDを1つ持たせる。
// 「投稿者/コメントした人」の判定(通知バッジ用)は引き続きlib/deviceId.tsの
// localStorage IDを使う。こちらは「自分のコメントを削除してよいか」の判定専用。
import { signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

let authUidPromise: Promise<string> | null = null;

/** 匿名認証のUIDを返す(未サインインなら裏でサインインしてから返す)。サーバー側では空文字を返す */
export function ensureAuthUid(): Promise<string> {
  if (typeof window === "undefined") return Promise.resolve("");

  if (!authUidPromise) {
    authUidPromise = new Promise((resolve) => {
      if (auth.currentUser) {
        resolve(auth.currentUser.uid);
        return;
      }
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
    });
  }
  return authUidPromise;
}

/** 今分かっている範囲でのUIDを同期的に返す(サインイン前ならnull) */
export function getKnownAuthUid(): string | null {
  return auth.currentUser?.uid ?? null;
}
