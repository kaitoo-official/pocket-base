// Wishlist(欲しいカード)。ログイン必須。Firestore users/{uid}/wishlist/{cardId} に保存。
// ドキュメントIDをcardId自体にすることで重複登録を構造的に防止している。
// 将来の自動マッチング機能(同じカードを求めている人同士を引き合わせる等)で
// collectionGroupクエリからも扱えるよう、パスに加えてuserIdもフィールドとして持たせている。

"use client";

import { useCallback, useEffect, useState } from "react";
import { collection, deleteDoc, doc, getDocs, serverTimestamp, setDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth/AuthProvider";

export interface WishlistEntry {
  cardId: string;
  createdAt: Date | null;
}

function wishlistCollection(uid: string) {
  return collection(db, "users", uid, "wishlist");
}

export async function getWishlistEntries(uid: string): Promise<WishlistEntry[]> {
  const snapshot = await getDocs(wishlistCollection(uid));
  return snapshot.docs.map((d) => {
    const data = d.data();
    const createdAt = data.createdAt instanceof Timestamp ? data.createdAt.toDate() : null;
    return { cardId: d.id, createdAt };
  });
}

export async function addToWishlist(uid: string, cardId: string): Promise<void> {
  await setDoc(doc(wishlistCollection(uid), cardId), {
    cardId,
    userId: uid,
    createdAt: serverTimestamp(),
  });
}

export async function removeFromWishlist(uid: string, cardId: string): Promise<void> {
  await deleteDoc(doc(wishlistCollection(uid), cardId));
}

/** Wishlistの状態と切り替え操作をまとめたフック。未ログイン時は常に空・操作不可 */
export function useWishlist() {
  const { user, isSignedIn, loading: authLoading } = useAuth();
  const [ids, setIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;

    Promise.resolve()
      .then(() => (isSignedIn && user ? getWishlistEntries(user.uid) : []))
      .then((entries) => {
        if (cancelled) return;
        setIds(entries.map((entry) => entry.cardId));
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isSignedIn, user, authLoading]);

  const toggleWishlist = useCallback(
    async (cardId: string) => {
      if (!isSignedIn || !user) return;
      const has = ids.includes(cardId);
      if (has) {
        setIds((prev) => prev.filter((id) => id !== cardId));
        await removeFromWishlist(user.uid, cardId);
      } else {
        setIds((prev) => [...prev, cardId]);
        await addToWishlist(user.uid, cardId);
      }
    },
    [ids, isSignedIn, user]
  );

  const isWishlisted = useCallback((cardId: string) => ids.includes(cardId), [ids]);

  return { wishlistIds: ids, isWishlisted, toggleWishlist, loading };
}
