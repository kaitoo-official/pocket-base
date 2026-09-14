import type { TradePost } from "@/lib/trade";
import { getDeviceId } from "@/lib/deviceId";

const COMMENTED_KEY = "pocketbase_commented_post_ids";
const LAST_SEEN_KEY = "pocketbase_trade_last_seen";

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorageが使えない環境では何もしない
  }
}

export function getCommentedPostIds(): string[] {
  return readJson<string[]>(COMMENTED_KEY, []);
}

export function markPostAsCommented(postId: string): void {
  const ids = new Set(getCommentedPostIds());
  ids.add(postId);
  writeJson(COMMENTED_KEY, [...ids]);
}

type LastSeenMap = Record<string, number>;

function getLastSeenMap(): LastSeenMap {
  return readJson<LastSeenMap>(LAST_SEEN_KEY, {});
}

export function markPostAsSeen(postId: string, at: Date = new Date()): void {
  const map = getLastSeenMap();
  map[postId] = at.getTime();
  writeJson(LAST_SEEN_KEY, map);
}

/**
 * 「自分の投稿」または「自分がコメントした投稿」に、自分以外からの新しいコメントが
 * ついている(＝まだ見ていない)かどうかを判定する。ログイン機能が無いため、
 * 投稿者/コメント者の判定はすべてlocalStorageの匿名デバイスIDで行う。
 */
export function isPostUnread(post: TradePost): boolean {
  const deviceId = getDeviceId();
  if (!deviceId || !post.lastCommentAt || !post.lastCommentAuthorId) return false;
  if (post.lastCommentAuthorId === deviceId) return false;

  const isAuthor = post.authorDeviceId === deviceId;
  const hasCommented = getCommentedPostIds().includes(post.id);
  if (!isAuthor && !hasCommented) return false;

  const lastSeen = getLastSeenMap()[post.id] ?? 0;
  return post.lastCommentAt.getTime() > lastSeen;
}

export function countUnreadPosts(posts: TradePost[]): number {
  return posts.filter(isPostUnread).length;
}
