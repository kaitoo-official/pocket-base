// マイコレクション(所持枚数の管理)。ログイン必須。
// Firestore users/{uid}/collection/{cardId} に保存。
// quantityは 0(未所持)/1/2/3(3枚以上)の4段階で管理する。
// 0にする操作は「未所持」を意味するため、ドキュメント自体を削除する
// (将来「交換に出せるカード」に流用する際、存在するドキュメント=所持している、として扱いやすくするため)。

"use client";

import { useCallback, useEffect, useState } from "react";
import { collection, deleteDoc, doc, getDocs, serverTimestamp, setDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth/AuthProvider";

export const MAX_COLLECTION_QUANTITY = 3;

export interface CollectionEntry {
  cardId: string;
  quantity: number;
  updatedAt: Date | null;
}

function collectionRef(uid: string) {
  return collection(db, "users", uid, "collection");
}

export async function getCollectionEntries(uid: string): Promise<CollectionEntry[]> {
  const snapshot = await getDocs(collectionRef(uid));
  return snapshot.docs.map((d) => {
    const data = d.data();
    const updatedAt = data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : null;
    return { cardId: d.id, quantity: (data.quantity as number) ?? 0, updatedAt };
  });
}

/** 所持枚数を設定する。0以下を指定するとドキュメントを削除(未所持扱い)する */
export async function setCollectionQuantity(uid: string, cardId: string, quantity: number): Promise<void> {
  const ref = doc(collectionRef(uid), cardId);
  if (quantity <= 0) {
    await deleteDoc(ref);
    return;
  }
  const clamped = Math.min(quantity, MAX_COLLECTION_QUANTITY);
  await setDoc(ref, { cardId, userId: uid, quantity: clamped, updatedAt: serverTimestamp() });
}

/** マイコレクションの状態と操作をまとめたフック。未ログイン時は常に空・操作不可 */
export function useCollection() {
  const { user, isSignedIn, loading: authLoading } = useAuth();
  const [entries, setEntries] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;

    Promise.resolve()
      .then(() => (isSignedIn && user ? getCollectionEntries(user.uid) : []))
      .then((list) => {
        if (cancelled) return;
        setEntries(Object.fromEntries(list.map((e) => [e.cardId, e.quantity])));
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isSignedIn, user, authLoading]);

  const setQuantity = useCallback(
    async (cardId: string, quantity: number) => {
      if (!isSignedIn || !user) return;
      const clamped = Math.max(0, Math.min(quantity, MAX_COLLECTION_QUANTITY));
      setEntries((prev) => {
        if (clamped === 0) {
          const next = { ...prev };
          delete next[cardId];
          return next;
        }
        return { ...prev, [cardId]: clamped };
      });
      await setCollectionQuantity(user.uid, cardId, clamped);
    },
    [isSignedIn, user]
  );

  const getQuantity = useCallback((cardId: string) => entries[cardId] ?? 0, [entries]);

  return { quantities: entries, getQuantity, setQuantity, loading };
}
