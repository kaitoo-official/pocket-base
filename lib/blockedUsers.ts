// 他ユーザーをブロックする機能。Apple App Store Guideline 1.2対応の一部。
// ブロックは自分のusers/{uid}/blockedUsersサブコレクションに記録するだけで、
// 相手の投稿・コメント自体を削除するわけではない(自分の画面にだけ表示しなくなる)。

import { useEffect, useState } from "react";
import { collection, deleteDoc, doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { useAuth } from "@/lib/auth/AuthProvider";

const USERS_COLLECTION = "users";
const BLOCKED_SUBCOLLECTION = "blockedUsers";

export async function blockUser(blockedUid: string, blockedNickname: string | null): Promise<void> {
  const user = auth.currentUser;
  if (!user || user.isAnonymous) {
    throw new Error("ログインが必要です");
  }
  if (user.uid === blockedUid) {
    throw new Error("自分自身はブロックできません");
  }
  await setDoc(doc(db, USERS_COLLECTION, user.uid, BLOCKED_SUBCOLLECTION, blockedUid), {
    blockedUid,
    blockedNickname: blockedNickname ?? null,
    createdAt: serverTimestamp(),
  });
}

export async function unblockUser(blockedUid: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;
  await deleteDoc(doc(db, USERS_COLLECTION, user.uid, BLOCKED_SUBCOLLECTION, blockedUid));
}

export interface BlockedUserEntry {
  blockedUid: string;
  blockedNickname: string | null;
}

/** ログイン中ユーザーがブロックした相手の一覧をリアルタイム購読する(ブロック管理画面用) */
export function subscribeToBlockedUsers(
  uid: string,
  onUpdate: (entries: BlockedUserEntry[]) => void
): () => void {
  const ref = collection(db, USERS_COLLECTION, uid, BLOCKED_SUBCOLLECTION);
  return onSnapshot(ref, (snapshot) => {
    onUpdate(
      snapshot.docs.map((d) => ({
        blockedUid: (d.data().blockedUid as string) ?? d.id,
        blockedNickname: (d.data().blockedNickname as string | null) ?? null,
      }))
    );
  });
}

/**
 * ログイン中ユーザーがブロックしたUIDの集合をリアルタイムで返すhook。
 * トレード投稿一覧・コメント一覧の両方で、ブロック相手のコンテンツを隠すために使う。
 * 未ログイン時は空集合を返す(ブロック機能自体がログイン必須のため)。
 */
export function useBlockedUserIds(): Set<string> {
  const { user, isSignedIn } = useAuth();
  const [blockedIds, setBlockedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isSignedIn || !user) return;
    const unsubscribe = subscribeToBlockedUsers(user.uid, (entries) => {
      setBlockedIds(new Set(entries.map((e) => e.blockedUid)));
    });
    return unsubscribe;
  }, [isSignedIn, user]);

  return isSignedIn ? blockedIds : EMPTY_SET;
}

const EMPTY_SET: Set<string> = new Set();
