"use client";

import { useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeftRight, Check, Copy, MessageCircle, Send, Star, type LucideIcon } from "lucide-react";
import { TradeCommentDrawer } from "@/components/TradeCommentDrawer";
import { formatTradeDate, MAX_CARDS_PER_SIDE, type CardOption, type TradePost } from "@/lib/trade";
import { isPostUnread, markPostAsSeen } from "@/lib/tradeNotifications";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { getDict } from "@/lib/i18n/dict";

// localStorage(既読状態)というReactの外にある状態を読むため、useSyncExternalStoreで
// サーバー(常に未読=false)とクライアントの値を安全に切り替える(そうしないとHydrationが不一致になる)。
// 他タブでの既読化にも追従できるよう、storageイベントで再評価する。
function subscribeToStorage(callback: () => void): () => void {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

/** トレード掲示板の投稿1件分のカード */
export function TradePostCard({
  post,
  cardMap,
}: {
  post: TradePost;
  cardMap: Map<string, CardOption>;
}) {
  const lang = useLang();
  const t = getDict(lang).trade.postCard;
  const [copied, setCopied] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const unread = useSyncExternalStore(
    subscribeToStorage,
    () => isPostUnread(post),
    () => false
  );

  function openComments() {
    setCommentsOpen(true);
    markPostAsSeen(post.id);
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(post.friendId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // クリップボードが使えない環境では何もしない
    }
  }

  return (
    <div className={`rounded-xl border border-line bg-surface p-4 shadow-xs sm:p-5 ${post.closed ? "opacity-60" : ""}`}>
      {(post.displayName || post.closed) && (
        <div className="mb-3 flex items-center justify-between gap-2">
          {post.displayName ? (
            <div className="flex items-center gap-2">
              {post.photoURL ? (
                <Image
                  src={post.photoURL}
                  alt=""
                  width={20}
                  height={20}
                  className="rounded-full"
                  referrerPolicy="no-referrer"
                />
              ) : null}
              <span className="text-xs font-medium text-muted">{post.displayName}</span>
            </div>
          ) : (
            <span />
          )}
          {post.closed && (
            <span className="rounded-full bg-line px-2 py-0.5 text-[11px] font-semibold text-muted">
              {t.closed}
            </span>
          )}
        </div>
      )}
      <div className="flex items-start gap-3 sm:gap-5">
        <TradeCardColumn
          label={t.offerLabel}
          undecided={t.undecided}
          icon={Send}
          accentGradient="from-violet-500 to-indigo-500"
          cardMap={cardMap}
          cardIds={post.offerCardIds}
        />
        <ArrowLeftRight className="mt-6 h-4 w-4 shrink-0 text-accent" />
        <TradeCardColumn
          label={t.wantLabel}
          undecided={t.undecided}
          icon={Star}
          accentGradient="from-teal-400 to-cyan-500"
          cardMap={cardMap}
          cardIds={post.wantCardIds}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted">{t.friendId}</span>
          <span className="font-[family-name:var(--font-inter)] text-sm font-semibold text-foreground">
            {post.friendId}
          </span>
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1 rounded-full border border-line px-2 py-0.5 text-xs text-muted transition-colors duration-150 hover:border-accent/40 hover:text-accent"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3" />
                {t.copied}
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                {t.copy}
              </>
            )}
          </button>
        </div>
        <p className="text-xs text-muted">{formatTradeDate(post.createdAt, lang)}</p>
      </div>

      {post.memo && <p className="mt-2 text-sm text-muted">{post.memo}</p>}

      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={openComments}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-teal-400 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-500/20 transition-opacity duration-150 hover:opacity-90"
        >
          <MessageCircle className="h-4 w-4" />
          {t.commentButton}
          <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-medium">
            {t.commentCount(post.commentCount.toLocaleString())}
          </span>
        </button>
        {unread && (
          <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold leading-none text-white">
            {t.new}
          </span>
        )}
        <span className="text-xs text-muted">
          {t.lastUpdated(formatTradeDate(post.lastCommentAt ?? post.createdAt, lang))}
        </span>
      </div>

      {commentsOpen && (
        <TradeCommentDrawer
          postId={post.id}
          commentCount={post.commentCount}
          onClose={() => setCommentsOpen(false)}
        />
      )}
    </div>
  );
}

function TradeCardColumn({
  label,
  undecided,
  icon: Icon,
  accentGradient,
  cardMap,
  cardIds,
}: {
  label: string;
  undecided: string;
  icon: LucideIcon;
  accentGradient: string;
  cardMap: Map<string, CardOption>;
  cardIds: string[];
}) {
  return (
    <div className="min-w-0 flex-1">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span
            className={`flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-br text-white ${accentGradient}`}
          >
            <Icon className="h-3 w-3" />
          </span>
          <p className="text-[11px] font-semibold tracking-wide text-muted">{label}</p>
        </div>
        <span className="text-[11px] text-muted">
          {cardIds.length}/{MAX_CARDS_PER_SIDE}
        </span>
      </div>
      {cardIds.length === 0 ? (
        <div className="flex h-16 w-12 shrink-0 flex-col items-center justify-center gap-0.5 rounded-lg bg-line text-muted">
          <span className="text-base font-bold leading-none">?</span>
          <span className="text-[9px] leading-none">{undecided}</span>
        </div>
      ) : (
        // 5列固定のグリッドで、最大10枚(5枚×2段)を見やすくコンパクトに表示する
        <div className="grid grid-cols-5 gap-1.5">
          {cardIds.map((id) => {
            const card = cardMap.get(id);
            if (!card) return null;
            return (
              <Link
                key={id}
                href={`/cards/${card.id}`}
                className="relative aspect-[245/342] overflow-hidden rounded-lg bg-background transition-opacity duration-150 hover:opacity-80"
              >
                <Image src={card.image} alt={card.name} fill sizes="60px" className="object-contain" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
