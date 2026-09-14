// Googleログイン/ログアウトの窓口。
//
// ゲスト状態ではlib/authUid.tsが裏で匿名認証(signInAnonymously)を行っている
// (コメント削除の本人確認用)。Googleログイン時に現在のユーザーが匿名なら、
// サインインではなく「匿名アカウントをGoogleにリンク」することで同じUIDを維持し、
// ゲスト時に付けたコメントの所有権が引き続き有効になるようにしている。
// 既に別デバイスでそのGoogleアカウントを使用済みでリンクできない場合のみ、
// 通常のGoogleサインインにフォールバックする(匿名データの引き継ぎは諦める)。

import {
  GoogleAuthProvider,
  linkWithPopup,
  signInWithPopup,
  signInWithRedirect,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

const googleProvider = new GoogleAuthProvider();

export type SignInResult =
  | { status: "success"; user: User }
  | { status: "cancelled" }
  | { status: "redirecting" }
  | { status: "error"; message: string };

function getErrorCode(error: unknown): string | undefined {
  return typeof error === "object" && error !== null && "code" in error
    ? String((error as { code: unknown }).code)
    : undefined;
}

export async function signInWithGoogle(): Promise<SignInResult> {
  try {
    const currentUser = auth.currentUser;

    if (currentUser?.isAnonymous) {
      try {
        const result = await linkWithPopup(currentUser, googleProvider);
        return { status: "success", user: result.user };
      } catch (linkError) {
        // 既に別デバイス等でそのGoogleアカウントにログイン済みの場合はリンクできない。
        // その場合は匿名データの引き継ぎを諦めて、通常のGoogleログインを試す。
        if (getErrorCode(linkError) !== "auth/credential-already-in-use") {
          throw linkError;
        }
      }
    }

    const result = await signInWithPopup(auth, googleProvider);
    return { status: "success", user: result.user };
  } catch (error) {
    const code = getErrorCode(error);

    if (code === "auth/popup-blocked") {
      // ポップアップがブロックされた場合はリダイレクト方式にフォールバックする。
      // このあとページ遷移するため、呼び出し元での後続処理は基本的に走らない。
      await signInWithRedirect(auth, googleProvider);
      return { status: "redirecting" };
    }
    if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
      return { status: "cancelled" };
    }
    return { status: "error", message: "ログインに失敗しました。時間をおいて試してください。" };
  }
}

export async function signOutOfGoogle(): Promise<void> {
  await firebaseSignOut(auth);
}
