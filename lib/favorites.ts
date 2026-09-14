// お気に入り。
// 未ログイン: ブラウザのlocalStorage(pocketbase_guest_favorites)に保存。
// ログイン済み: Firestore users/{uid}/favorites/{cardId} に保存
// (ドキュメントIDをcardId自体にすることで、同じカードの重複登録を構造的に防止している)。

"use client";

import { useCallback, useEffect, useState } from "react";
import { collection, deleteDoc, doc, getDocs, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth/AuthProvider";

const GUEST_KEY = "pocketbase_guest_favorites";

function readGuestFavoriteIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(GUEST_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function writeGuestFavoriteIds(ids: string[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(GUEST_KEY, JSON.stringify(ids));
  } catch {
    // localStorageが使えない環境では何もしない
  }
}

export function getGuestFavoriteIds(): string[] {
  return readGuestFavoriteIds();
}

export function clearGuestFavoriteIds(): void {
  writeGuestFavoriteIds([]);
}

function favoritesCollection(uid: string) {
  return collection(db, "users", uid, "favorites");
}

export async function getCloudFavoriteIds(uid: string): Promise<string[]> {
  const snapshot = await getDocs(favoritesCollection(uid));
  return snapshot.docs.map((d) => d.id);
}

async function addCloudFavorite(uid: string, cardId: string): Promise<void> {
  await setDoc(doc(favoritesCollection(uid), cardId), { cardId, createdAt: serverTimestamp() });
}

async function removeCloudFavorite(uid: string, cardId: string): Promise<void> {
  await deleteDoc(doc(favoritesCollection(uid), cardId));
}

/**
 * ゲスト時のお気に入りをクラウドにマージする(ログイン直後、引き継ぎ確認後に呼ぶ)。
 * 既存のクラウドお気に入りは上書きせず、重複するIDだけスキップする。
 * 成功した場合のみ呼び出し側でlocalStorageを削除すること。
 */
export async function mergeGuestFavoritesToCloud(uid: string): Promise<void> {
  const guestIds = readGuestFavoriteIds();
  if (guestIds.length === 0) return;
  const existingIds = new Set(await getCloudFavoriteIds(uid));
  const toAdd = guestIds.filter((id) => !existingIds.has(id));
  await Promise.all(toAdd.map((id) => addCloudFavorite(uid, id)));
}

/**
 * お気に入りの状態と切り替え操作をまとめたフック。
 * ログイン状態に応じて自動的にlocalStorage/クラウドを使い分ける。
 */
export function useFavorites() {
  const { user, isSignedIn, loading: authLoading } = useAuth();
  const [ids, setIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;

    Promise.resolve()
      .then(() => (isSignedIn && user ? getCloudFavoriteIds(user.uid) : readGuestFavoriteIds()))
      .then((nextIds) => {
        if (cancelled) return;
        setIds(nextIds);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isSignedIn, user, authLoading]);

  const toggleFavorite = useCallback(
    async (cardId: string) => {
      const isFavorited = ids.includes(cardId);

      if (isSignedIn && user) {
        if (isFavorited) {
          setIds((prev) => prev.filter((id) => id !== cardId));
          await removeCloudFavorite(user.uid, cardId);
        } else {
          setIds((prev) => [...prev, cardId]);
          await addCloudFavorite(user.uid, cardId);
        }
        return;
      }

      const next = isFavorited ? ids.filter((id) => id !== cardId) : [...ids, cardId];
      setIds(next);
      writeGuestFavoriteIds(next);
    },
    [ids, isSignedIn, user]
  );

  const isFavorite = useCallback((cardId: string) => ids.includes(cardId), [ids]);

  return { favoriteIds: ids, isFavorite, toggleFavorite, loading };
}
