// トレード掲示板の投稿データをFirestoreとやり取りするための窓口。
// Firestoreのセキュリティルール(tradePosts)と対になっているので、
// フィールドを増減する場合はルールも一緒に更新すること。

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getCountFromServer,
  getDocs,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { getDeviceId } from "@/lib/deviceId";
import { ensureAuthUid } from "@/lib/authUid";
import { getJapaneseName } from "@/lib/nameJa";
import { getCardImageUrl } from "@/lib/getCardImage";
import { getAllCards } from "@/lib/data";
import { getEffectiveType, getOptionsFromCardTypes, getOptionsFromCardRarities } from "@/lib/filterOptions";
import type { Lang } from "@/lib/i18n/lang";
import type { Card } from "@/types/card";

const TRADE_POSTS_COLLECTION = "tradePosts";
const MAX_POSTS = 100;

/** 1回のトレード投稿で選べるカードの上限枚数(出す/求めるそれぞれ) */
export const MAX_CARDS_PER_SIDE = 10;

/** カード選択UIで使う、カード1件分の最小限の情報 */
export interface CardOption {
  id: string;
  name: string;
  image: string;
  /** 絞り込み用: エネルギータイプ(トレーナーズはItem/Supporter等) */
  type: string;
  /** 絞り込み用: レアリティ */
  rarity: string;
  /** 絞り込み用: 色違いかどうか(☆・☆☆のみ存在しうる) */
  shiny: boolean;
  /** デッキの妥当性チェック(たねポケモン判定)用 */
  category: Card["category"];
  /** デッキの妥当性チェック(たねポケモン判定)用。トレーナーズには存在しない */
  stage?: string;
}

export interface TradePost {
  id: string;
  friendId: string;
  offerCardIds: string[];
  wantCardIds: string[];
  memo: string;
  createdAt: Date | null;
  authorDeviceId: string;
  commentCount: number;
  lastCommentAt: Date | null;
  lastCommentAuthorId: string | null;
  /** Googleログインして投稿した場合のみ入る(既存の匿名投稿にはこのフィールドが無い)。
   *  自分の投稿の判定(編集・削除・管理ページ)専用で、公開表示はしない。 */
  userId: string | null;
  /** 掲示板に公開表示される名前。Googleの本名ではなく、投稿者が自由に決められるニックネーム */
  nickname: string | null;
  closed: boolean;
}

export interface NewTradePost {
  friendId: string;
  offerCardIds: string[];
  wantCardIds: string[];
  memo: string;
  /** 掲示板に公開表示するニックネーム(Googleの本名は使わない) */
  nickname: string;
}

/**
 * トレード投稿を作成する。ログイン(Googleサインイン)必須。
 * Firestoreルール側でも request.auth (かつ匿名認証ではないこと)を必須にしている。
 * プライバシーのため、Googleアカウントの本名やプロフィール画像は掲示板に一切出さず、
 * 投稿者が自由に決めたニックネームだけを公開表示する。
 */
export async function createTradePost(post: NewTradePost): Promise<void> {
  const user = auth.currentUser;
  if (!user || user.isAnonymous) {
    throw new Error("ログインが必要です");
  }

  await addDoc(collection(db, TRADE_POSTS_COLLECTION), {
    ...post,
    createdAt: serverTimestamp(),
    authorDeviceId: getDeviceId(),
    commentCount: 0,
    lastCommentAt: null,
    lastCommentAuthorId: null,
    userId: user.uid,
    closed: false,
  });
}

/** 自分が投稿したトレードを新しい順に取得する(トレード投稿管理ページ用) */
export async function getMyTradePosts(uid: string): Promise<TradePost[]> {
  const myQuery = query(
    collection(db, TRADE_POSTS_COLLECTION),
    where("userId", "==", uid),
    orderBy("createdAt", "desc")
  );
  const snapshot = await getDocs(myQuery);
  return snapshot.docs.map(mapPostDoc);
}

/** 投稿の内容を編集する(投稿者本人のみ。Firestoreルール側でも所有者チェックを行っている) */
export async function updateTradePost(
  postId: string,
  update: { friendId: string; offerCardIds: string[]; wantCardIds: string[]; memo: string; closed: boolean }
): Promise<void> {
  await updateDoc(doc(db, TRADE_POSTS_COLLECTION, postId), { ...update });
}

/** 投稿を削除する(投稿者本人のみ) */
export async function deleteTradePost(postId: string): Promise<void> {
  await deleteDoc(doc(db, TRADE_POSTS_COLLECTION, postId));
}

/** トレード投稿の総数を返す(Homeの統計表示用)。取得に失敗した場合は0を返す */
export async function getTradePostCount(): Promise<number> {
  try {
    const snapshot = await getCountFromServer(collection(db, TRADE_POSTS_COLLECTION));
    return snapshot.data().count;
  } catch {
    return 0;
  }
}

export interface TradeComment {
  id: string;
  nickname: string;
  text: string;
  createdAt: Date | null;
  authorDeviceId: string;
  /** 自分のコメントかどうかの判定(削除ボタン表示用)に使う、匿名認証のUID */
  authorUid: string;
}

export interface NewTradeComment {
  nickname: string;
  text: string;
}

export async function createTradeComment(postId: string, comment: NewTradeComment): Promise<void> {
  const deviceId = getDeviceId();
  const authorUid = await ensureAuthUid();
  await addDoc(collection(db, TRADE_POSTS_COLLECTION, postId, "comments"), {
    ...comment,
    createdAt: serverTimestamp(),
    authorDeviceId: deviceId,
    authorUid,
  });
  // 投稿側にコメント件数・最新コメント情報を非正規化して持たせておく
  // (一覧表示のたびに全投稿のコメント件数をサブコレクションから数え直すのは高コストなため)
  await updateDoc(doc(db, TRADE_POSTS_COLLECTION, postId), {
    commentCount: increment(1),
    lastCommentAt: serverTimestamp(),
    lastCommentAuthorId: deviceId,
  });
}

/**
 * 自分のコメントを削除する。ログイン機能が無いため、なりすまし削除を防ぐ目的で
 * Firestoreルール側は匿名認証のUID(authorUid)が一致する場合のみ許可している。
 * 削除してもcommentCount等は補正しない(サーバー側の再集計処理が無いため、
 * 表示上のコメント件数が実際より少し多いまま残ることがある)。
 */
export async function deleteTradeComment(postId: string, commentId: string): Promise<void> {
  await deleteDoc(doc(db, TRADE_POSTS_COLLECTION, postId, "comments", commentId));
}

/** 投稿1件分のコメント一覧をリアルタイムで購読する(古い順)。戻り値の関数で購読を停止する */
export function subscribeToTradeComments(
  postId: string,
  onUpdate: (comments: TradeComment[]) => void
): () => void {
  const commentsQuery = query(
    collection(db, TRADE_POSTS_COLLECTION, postId, "comments"),
    orderBy("createdAt", "asc")
  );

  return onSnapshot(commentsQuery, (snapshot) => {
    const comments = snapshot.docs.map((doc) => {
      const data = doc.data();
      const createdAt = data.createdAt instanceof Timestamp ? data.createdAt.toDate() : null;
      return {
        id: doc.id,
        nickname: (data.nickname as string) ?? "",
        text: (data.text as string) ?? "",
        createdAt,
        authorDeviceId: (data.authorDeviceId as string) ?? "",
        authorUid: (data.authorUid as string) ?? "",
      };
    });
    onUpdate(comments);
  });
}

export function formatTradeDate(date: Date | null, lang: Lang = "ja"): string {
  if (!date) return "";
  return date.toLocaleString(lang === "en" ? "en-US" : "ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function mapPostDoc(doc: { id: string; data: () => Record<string, unknown> }): TradePost {
  const data = doc.data();
  const createdAt = data.createdAt instanceof Timestamp ? data.createdAt.toDate() : null;
  const lastCommentAt = data.lastCommentAt instanceof Timestamp ? data.lastCommentAt.toDate() : null;
  return {
    id: doc.id,
    friendId: data.friendId as string,
    offerCardIds: (data.offerCardIds as string[]) ?? [],
    wantCardIds: (data.wantCardIds as string[]) ?? [],
    memo: (data.memo as string) ?? "",
    createdAt,
    authorDeviceId: (data.authorDeviceId as string) ?? "",
    commentCount: (data.commentCount as number) ?? 0,
    lastCommentAt,
    lastCommentAuthorId: (data.lastCommentAuthorId as string | null) ?? null,
    userId: (data.userId as string | null) ?? null,
    nickname: (data.nickname as string | null) ?? null,
    closed: (data.closed as boolean) ?? false,
  };
}

/**
 * トレード投稿一覧をリアルタイムで購読する。
 * 戻り値の関数を呼ぶと購読を停止する(コンポーネントのアンマウント時に使う)。
 */
export function subscribeToTradePosts(onUpdate: (posts: TradePost[]) => void): () => void {
  const tradeQuery = query(
    collection(db, TRADE_POSTS_COLLECTION),
    orderBy("createdAt", "desc"),
    limit(MAX_POSTS)
  );

  return onSnapshot(tradeQuery, (snapshot) => {
    onUpdate(snapshot.docs.map(mapPostDoc));
  });
}

/** 最新のトレード投稿をcount件だけ一度だけ取得する(Homeのプレビュー表示用)。失敗時は空配列を返す */
export async function getLatestTradePosts(count: number): Promise<TradePost[]> {
  try {
    const tradeQuery = query(
      collection(db, TRADE_POSTS_COLLECTION),
      orderBy("createdAt", "desc"),
      limit(count)
    );
    const snapshot = await getDocs(tradeQuery);
    return snapshot.docs.map(mapPostDoc);
  } catch {
    return [];
  }
}

/**
 * ゲーム内のトレード機能は ♦1〜♦4・★1・★2(色違い含む)のカードのみ対象で、
 * ★3・Crown Rare・プロモカードは交換不可(gamewith.jpのトレード条件記事で確認済み)。
 * データ側の tradable フラグがこの制限をそのまま表しているので、それだけで絞り込む。
 */
export function getTradableCardOptions(lang: Lang = "ja"): CardOption[] {
  return getAllCards()
    .filter((card) => card.tradable)
    .map((card) => ({
      id: card.id,
      name: getJapaneseName(card, lang) ?? card.name,
      image: getCardImageUrl(card),
      type: getEffectiveType(card),
      rarity: card.rarity,
      shiny: card.shiny,
      category: card.category,
      stage: card.stage,
    }));
}

export const getTradableTypeOptions = getOptionsFromCardTypes;
export const getTradableRarityOptions = getOptionsFromCardRarities;
