// Googleログインしたユーザーのプロフィール(users/{uid})をFirestoreと同期する。

import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import type { User } from "firebase/auth";
import { db } from "@/lib/firebase";

const USERS_COLLECTION = "users";

/**
 * Googleログイン成功のたびに呼ぶ。ドキュメントが無ければ作成し、
 * あれば表示名・メール・写真URLだけ最新の状態に更新する(createdAtは保持)。
 */
export async function syncUserProfile(user: User): Promise<void> {
  const ref = doc(db, USERS_COLLECTION, user.uid);
  const snapshot = await getDoc(ref);

  const profile = {
    provider: "google" as const,
    providerUid: user.providerData[0]?.uid ?? user.uid,
    displayName: user.displayName ?? "",
    email: user.email ?? "",
    photoURL: user.photoURL ?? "",
    updatedAt: serverTimestamp(),
  };

  if (snapshot.exists()) {
    await setDoc(ref, profile, { merge: true });
  } else {
    await setDoc(ref, { ...profile, createdAt: serverTimestamp() });
  }
}
