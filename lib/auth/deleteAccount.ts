// アカウント削除(Apple App Store Guideline 5.1.1(v)対応)。
//
// 順序は「再認証 → Firestoreデータ削除 → (Appleのみ)トークン失効 → Authユーザー削除」。
// データ削除は何度実行しても同じ結果になるため、途中で失敗してもユーザーが再試行すれば残りが片付く。
// Authユーザーを最後に消すのは、それまでFirestoreルールが本人確認(request.auth)に使えるため。
//
// 残るもの: reports(通報の記録)とfeedback(意見・要望)。Firestoreルール上、クライアントからは削除できない。
// 通報はアカウント削除後は本人のUIDと結びつかなくなる。詳細はapp/privacy(lib/i18n/dict.ts)に明記している。

import {
  GoogleAuthProvider,
  OAuthProvider,
  deleteUser,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  revokeAccessToken,
  type User,
} from "firebase/auth";
import { collection, deleteDoc, doc, getDocs, query, where, writeBatch, type DocumentReference } from "firebase/firestore";
import { Capacitor } from "@capacitor/core";
import { FirebaseAuthentication } from "@capacitor-firebase/authentication";
import { auth, db } from "@/lib/firebase";

export type DeleteAccountResult =
  | { status: "success" }
  | { status: "cancelled" }
  | { status: "error"; reason: "not-signed-in" | "account-mismatch" | "failed" };

const USER_SUBCOLLECTIONS = ["wishlist", "collection", "decks", "blockedUsers"] as const;
const BATCH_LIMIT = 400;

function getErrorCode(error: unknown): string | undefined {
  return typeof error === "object" && error !== null && "code" in error
    ? String((error as { code: unknown }).code)
    : undefined;
}

function isCancelled(error: unknown): boolean {
  const code = getErrorCode(error);
  if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") return true;
  const message = error instanceof Error ? error.message : String(error);
  return /cancel/i.test(message);
}

/**
 * 本人確認のための再ログイン。Appleの場合は、トークン失効に使うauthorizationCodeを返す。
 * (Firebaseは「最近ログインしたユーザー」にしかアカウント削除を許可しないため、再認証は必須)
 */
async function reauthenticate(user: User, providerId: "google.com" | "apple.com"): Promise<{ appleAuthorizationCode?: string }> {
  const isNative = Capacitor.isNativePlatform();

  if (providerId === "google.com") {
    if (isNative) {
      const { credential } = await FirebaseAuthentication.signInWithGoogle();
      if (!credential?.idToken) throw new Error("cancelled");
      await reauthenticateWithCredential(user, GoogleAuthProvider.credential(credential.idToken));
    } else {
      await reauthenticateWithPopup(user, new GoogleAuthProvider());
    }
    return {};
  }

  const appleProvider = new OAuthProvider("apple.com");
  if (Capacitor.getPlatform() === "ios") {
    const { credential } = await FirebaseAuthentication.signInWithApple();
    if (!credential?.idToken) throw new Error("cancelled");
    await reauthenticateWithCredential(user, appleProvider.credential({ idToken: credential.idToken, rawNonce: credential.nonce }));
    return { appleAuthorizationCode: credential.authorizationCode };
  }

  const result = await reauthenticateWithPopup(user, appleProvider);
  const tokenResponse = (result as unknown as { _tokenResponse?: { oauthAuthorizationCode?: string } })._tokenResponse;
  return { appleAuthorizationCode: tokenResponse?.oauthAuthorizationCode };
}

async function deleteRefs(refs: DocumentReference[]): Promise<void> {
  for (let i = 0; i < refs.length; i += BATCH_LIMIT) {
    const batch = writeBatch(db);
    for (const ref of refs.slice(i, i + BATCH_LIMIT)) batch.delete(ref);
    await batch.commit();
  }
}

/**
 * このユーザーが書いたコメントを全投稿から探して削除する。
 * collectionGroupクエリは手動のインデックス作成が別途必要になるため使わず、
 * 投稿ごとに(自動インデックスで動く)authorUid一致のクエリを投げる。
 */
async function deleteMyComments(uid: string): Promise<void> {
  const posts = await getDocs(collection(db, "tradePosts"));
  const postIds = posts.docs.map((d) => d.id);
  for (let i = 0; i < postIds.length; i += 10) {
    const found = await Promise.all(
      postIds.slice(i, i + 10).map((postId) =>
        getDocs(query(collection(db, "tradePosts", postId, "comments"), where("authorUid", "==", uid)))
      )
    );
    await deleteRefs(found.flatMap((snapshot) => snapshot.docs.map((d) => d.ref)));
  }
}

async function deleteUserData(uid: string): Promise<void> {
  await deleteMyComments(uid);

  const myPosts = await getDocs(query(collection(db, "tradePosts"), where("userId", "==", uid)));
  await deleteRefs(myPosts.docs.map((d) => d.ref));

  for (const name of USER_SUBCOLLECTIONS) {
    const snapshot = await getDocs(collection(db, "users", uid, name));
    await deleteRefs(snapshot.docs.map((d) => d.ref));
  }

  await deleteDoc(doc(db, "users", uid));
}

function clearLocalData(): void {
  try {
    const keys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key?.startsWith("pocketbase_")) keys.push(key);
    }
    keys.forEach((key) => window.localStorage.removeItem(key));
  } catch {
    // ストレージが使えない環境では何もしない
  }
}

export async function deleteAccount(): Promise<DeleteAccountResult> {
  const user = auth.currentUser;
  const providerId = user?.providerData.find((p) => p.providerId === "google.com" || p.providerId === "apple.com")?.providerId;
  if (!user || user.isAnonymous || (providerId !== "google.com" && providerId !== "apple.com")) {
    return { status: "error", reason: "not-signed-in" };
  }

  let appleAuthorizationCode: string | undefined;
  try {
    ({ appleAuthorizationCode } = await reauthenticate(user, providerId));
  } catch (error) {
    if (isCancelled(error)) return { status: "cancelled" };
    if (getErrorCode(error) === "auth/user-mismatch") return { status: "error", reason: "account-mismatch" };
    return { status: "error", reason: "failed" };
  }

  try {
    await deleteUserData(user.uid);

    if (appleAuthorizationCode) {
      try {
        await revokeAccessToken(auth, appleAuthorizationCode);
      } catch (error) {
        // 失効に失敗してもアカウント削除自体は続行する(ユーザーの削除要求を止めない)
        console.warn("Apple token revocation failed", getErrorCode(error));
      }
    }

    await deleteUser(user);
  } catch {
    return { status: "error", reason: "failed" };
  }

  clearLocalData();
  return { status: "success" };
}
