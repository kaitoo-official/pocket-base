// Googleログインしたユーザーのプロフィール(users/{uid})をFirestoreと同期する。

import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import type { User } from "firebase/auth";
import { db } from "@/lib/firebase";

const USERS_COLLECTION = "users";

/**
 * Googleログイン成功のたびに呼ぶ。ドキュメントが無ければ作成し、
 * あれば表示名・メール・写真URLだけ最新の状態に更新する(createdAtは保持)。
 *
 * ゲスト時の匿名認証アカウントをGoogleにリンクした場合、Firebaseの仕様上
 * トップレベルのuser.displayName/user.photoURLが空のまま残ることがあるため、
 * その場合はリンクされたGoogleプロバイダ自身のprovider情報(providerData[0])から補う。
 */
export async function syncUserProfile(user: User): Promise<void> {
  const ref = doc(db, USERS_COLLECTION, user.uid);
  const snapshot = await getDoc(ref);
  const googleProviderData = user.providerData[0];

  const profile = {
    provider: "google" as const,
    providerUid: googleProviderData?.uid ?? user.uid,
    displayName: user.displayName || googleProviderData?.displayName || "",
    email: user.email || googleProviderData?.email || "",
    photoURL: user.photoURL || googleProviderData?.photoURL || "",
    updatedAt: serverTimestamp(),
  };

  if (snapshot.exists()) {
    await setDoc(ref, profile, { merge: true });
  } else {
    await setDoc(ref, { ...profile, createdAt: serverTimestamp() });
  }
}
