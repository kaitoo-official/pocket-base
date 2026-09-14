// デッキ保存。
// 未ログイン: localStorage(pocketbase_guest_decks)に仮保存。
// ログイン済み: Firestore users/{uid}/decks/{deckId} に保存。
// 無料会員は合計MAX_FREE_DECKS件までしか保存できない(課金機能は今回実装しないため、
// 上限を超える場合は常にこのメッセージを表示するだけで、有料プランへの導線は出さない)。

"use client";

import { useCallback, useEffect, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth/AuthProvider";

export const MAX_FREE_DECKS = 3;

const GUEST_KEY = "pocketbase_guest_decks";

export interface Deck {
  id: string;
  deckName: string;
  cards: string[];
  createdAt: Date | null;
  updatedAt: Date | null;
}

interface GuestDeck {
  id: string;
  deckName: string;
  cards: string[];
  createdAt: string;
  updatedAt: string;
}

function readGuestDecks(): GuestDeck[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(GUEST_KEY);
    return raw ? (JSON.parse(raw) as GuestDeck[]) : [];
  } catch {
    return [];
  }
}

function writeGuestDecks(decks: GuestDeck[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(GUEST_KEY, JSON.stringify(decks));
  } catch {
    // localStorageが使えない環境では何もしない
  }
}

function toDeck(guestDeck: GuestDeck): Deck {
  return {
    id: guestDeck.id,
    deckName: guestDeck.deckName,
    cards: guestDeck.cards,
    createdAt: new Date(guestDeck.createdAt),
    updatedAt: new Date(guestDeck.updatedAt),
  };
}

function generateId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function decksCollection(uid: string) {
  return collection(db, "users", uid, "decks");
}

export async function getCloudDecks(uid: string): Promise<Deck[]> {
  const snapshot = await getDocs(decksCollection(uid));
  return snapshot.docs.map((d) => {
    const data = d.data();
    const createdAt = data.createdAt instanceof Timestamp ? data.createdAt.toDate() : null;
    const updatedAt = data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : null;
    return {
      id: d.id,
      deckName: (data.deckName as string) ?? "",
      cards: (data.cards as string[]) ?? [],
      createdAt,
      updatedAt,
    };
  });
}

async function createCloudDeck(uid: string, deckName: string, cards: string[]): Promise<void> {
  await setDoc(doc(decksCollection(uid), generateId()), {
    deckName,
    userId: uid,
    cards,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

async function updateCloudDeck(uid: string, deckId: string, deckName: string, cards: string[]): Promise<void> {
  await updateDoc(doc(decksCollection(uid), deckId), { deckName, cards, updatedAt: serverTimestamp() });
}

async function deleteCloudDeck(uid: string, deckId: string): Promise<void> {
  await deleteDoc(doc(decksCollection(uid), deckId));
}

/**
 * ゲスト時の仮デッキをクラウドにマージする(ログイン直後、引き継ぎ確認後に呼ぶ)。
 * 既存のクラウドデッキは上書きせず、無料会員の上限(MAX_FREE_DECKS)に収まる分だけ追加する。
 * 上限に収まらず移行できなかった件数を返す(呼び出し側で案内するため)。
 * 成功した分だけ呼び出し側でlocalStorageから取り除くこと。
 */
export async function mergeGuestDecksToCloud(uid: string): Promise<{ migrated: number; skipped: number }> {
  const guestDecks = readGuestDecks();
  if (guestDecks.length === 0) return { migrated: 0, skipped: 0 };

  const existing = await getCloudDecks(uid);
  const remainingSlots = Math.max(0, MAX_FREE_DECKS - existing.length);
  const toMigrate = guestDecks.slice(0, remainingSlots);
  const toSkip = guestDecks.slice(remainingSlots);

  await Promise.all(toMigrate.map((deck) => createCloudDeck(uid, deck.deckName, deck.cards)));
  // 移行できなかった分だけlocalStorageに残す
  writeGuestDecks(toSkip);

  return { migrated: toMigrate.length, skipped: toSkip.length };
}

/** デッキの一覧・作成・更新・削除と、無料会員の3デッキ制限をまとめたフック */
export function useDecks() {
  const { user, isSignedIn, loading: authLoading } = useAuth();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (isSignedIn && user) {
      setDecks(await getCloudDecks(user.uid));
    } else {
      setDecks(readGuestDecks().map(toDeck));
    }
  }, [isSignedIn, user]);

  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;

    Promise.resolve()
      .then(() => (isSignedIn && user ? getCloudDecks(user.uid) : readGuestDecks().map(toDeck)))
      .then((list) => {
        if (cancelled) return;
        setDecks(list);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isSignedIn, user, authLoading]);

  const createDeck = useCallback(
    async (deckName: string, cards: string[]): Promise<{ ok: true } | { ok: false; reason: "limit" }> => {
      if (decks.length >= MAX_FREE_DECKS) return { ok: false, reason: "limit" };

      if (isSignedIn && user) {
        await createCloudDeck(user.uid, deckName, cards);
      } else {
        const now = new Date().toISOString();
        const guestDecks = readGuestDecks();
        guestDecks.push({ id: generateId(), deckName, cards, createdAt: now, updatedAt: now });
        writeGuestDecks(guestDecks);
      }
      await reload();
      return { ok: true };
    },
    [decks.length, isSignedIn, user, reload]
  );

  const updateDeck = useCallback(
    async (deckId: string, deckName: string, cards: string[]) => {
      if (isSignedIn && user) {
        await updateCloudDeck(user.uid, deckId, deckName, cards);
      } else {
        const now = new Date().toISOString();
        const guestDecks = readGuestDecks().map((deck) =>
          deck.id === deckId ? { ...deck, deckName, cards, updatedAt: now } : deck
        );
        writeGuestDecks(guestDecks);
      }
      await reload();
    },
    [isSignedIn, user, reload]
  );

  const deleteDeck = useCallback(
    async (deckId: string) => {
      if (isSignedIn && user) {
        await deleteCloudDeck(user.uid, deckId);
      } else {
        writeGuestDecks(readGuestDecks().filter((deck) => deck.id !== deckId));
      }
      await reload();
    },
    [isSignedIn, user, reload]
  );

  return {
    decks,
    loading,
    createDeck,
    updateDeck,
    deleteDeck,
    canCreateMore: decks.length < MAX_FREE_DECKS,
  };
}
