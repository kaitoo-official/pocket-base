// Google/Appleでログインしたユーザーのプロフィール(users/{uid})をFirestoreと同期する。

import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import type { User } from "firebase/auth";
import { db } from "@/lib/firebase";

const USERS_COLLECTION = "users";

/**
 * ログイン成功のたびに呼ぶ。ドキュメントが無ければ作成し、
 * あれば表示名・メール・写真URLだけ最新の状態に更新する(createdAtは保持)。
 *
 * ゲスト時の匿名認証アカウントをリンクした場合、Firebaseの仕様上
 * トップレベルのuser.displayName/user.photoURLが空のまま残ることがあるため、
 * その場合はリンクされたプロバイダ自身のprovider情報(providerData[0])から補う。
 */
export async function syncUserProfile(user: User): Promise<void> {
  const ref = doc(db, USERS_COLLECTION, user.uid);
  const snapshot = await getDoc(ref);
  const providerData = user.providerData[0];
  const provider = providerData?.providerId === "apple.com" ? ("apple" as const) : ("google" as const);

  const profile = {
    provider,
    providerUid: providerData?.uid ?? user.uid,
    displayName: user.displayName || providerData?.displayName || "",
    email: user.email || providerData?.email || "",
    photoURL: user.photoURL || providerData?.photoURL || "",
    updatedAt: serverTimestamp(),
  };

  if (snapshot.exists()) {
    await setDoc(ref, profile, { merge: true });
  } else {
    await setDoc(ref, { ...profile, createdAt: serverTimestamp() });
  }
}
