"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Pencil, Trash2, RotateCcw, CheckCircle2 } from "lucide-react";
import { RequireAuth } from "@/components/RequireAuth";
import { CardPicker } from "@/components/CardPicker";
import { useAuth } from "@/lib/auth/AuthProvider";
import {
  getMyTradePosts,
  updateTradePost,
  deleteTradePost,
  formatTradeDate,
  MAX_CARDS_PER_SIDE,
  type CardOption,
  type TradePost,
} from "@/lib/trade";
import { getDict } from "@/lib/i18n/dict";
import type { Option } from "@/lib/filterOptions";
import type { Lang } from "@/lib/i18n/lang";

function EditForm({
  post,
  cards,
  typeOptions,
  rarityOptions,
  lang,
  onCancel,
  onSaved,
}: {
  post: TradePost;
  cards: CardOption[];
  typeOptions: Option[];
  rarityOptions: Option[];
  lang: Lang;
  onCancel: () => void;
  onSaved: (updated: TradePost) => void;
}) {
  const t = getDict(lang).trade.composer;
  const [friendId, setFriendId] = useState(post.friendId);
  const [offerCardIds, setOfferCardIds] = useState(post.offerCardIds);
  const [wantCardIds, setWantCardIds] = useState(post.wantCardIds);
  const [memo, setMemo] = useState(post.memo);
  const [saving, setSaving] = useState(false);

  return (
    <div className="mt-3 space-y-4 rounded-xl border border-line bg-background p-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <CardPicker
          label={t.offerCardsLabel}
          cards={cards}
          typeOptions={typeOptions}
          rarityOptions={rarityOptions}
          value={offerCardIds}
          onChange={setOfferCardIds}
          max={MAX_CARDS_PER_SIDE}
        />
        <CardPicker
          label={t.wantCardsLabel}
          cards={cards}
          typeOptions={typeOptions}
          rarityOptions={rarityOptions}
          value={wantCardIds}
          onChange={setWantCardIds}
          max={MAX_CARDS_PER_SIDE}
        />
      </div>
      <textarea
        value={memo}
        onChange={(event) => setMemo(event.target.value.slice(0, 200))}
        rows={2}
        placeholder={t.memoPlaceholder}
        className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
      />
      <input
        value={friendId}
        onChange={(event) => setFriendId(event.target.value.replace(/\D/g, "").slice(0, 16))}
        className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
      />
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-hover"
        >
          {getDict(lang).decks.cancel}
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={async () => {
            setSaving(true);
            await updateTradePost(post.id, { friendId, offerCardIds, wantCardIds, memo, closed: post.closed });
            onSaved({ ...post, friendId, offerCardIds, wantCardIds, memo });
            setSaving(false);
          }}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-accent-strong disabled:opacity-60"
        >
          {getDict(lang).decks.save}
        </button>
      </div>
    </div>
  );
}

function MyTradesContent({
  cards,
  typeOptions,
  rarityOptions,
  lang,
}: {
  cards: CardOption[];
  typeOptions: Option[];
  rarityOptions: Option[];
  lang: Lang;
}) {
  const t = getDict(lang).myTrades;
  const { user } = useAuth();
  const [posts, setPosts] = useState<TradePost[] | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const cardMap = useMemo(() => new Map(cards.map((c) => [c.id, c])), [cards]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    getMyTradePosts(user.uid).then((list) => {
      if (!cancelled) setPosts(list);
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  function updateLocal(updated: TradePost) {
    setPosts((prev) => (prev ? prev.map((p) => (p.id === updated.id ? updated : p)) : prev));
  }

  async function toggleClosed(post: TradePost) {
    const closed = !post.closed;
    await updateTradePost(post.id, {
      friendId: post.friendId,
      offerCardIds: post.offerCardIds,
      wantCardIds: post.wantCardIds,
      memo: post.memo,
      closed,
    });
    updateLocal({ ...post, closed });
  }

  async function handleDelete(postId: string) {
    if (!window.confirm(t.deleteConfirm)) return;
    await deleteTradePost(postId);
    setPosts((prev) => (prev ? prev.filter((p) => p.id !== postId) : prev));
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      <h1 className="text-xl font-bold text-foreground">{t.title}</h1>

      {posts !== null && posts.length === 0 && <p className="mt-8 text-sm text-muted">{t.empty}</p>}

      <div className="mt-6 space-y-4">
        {posts?.map((post) => {
          const offerCards = post.offerCardIds.map((id) => cardMap.get(id)).filter(Boolean);
          const wantCards = post.wantCardIds.map((id) => cardMap.get(id)).filter(Boolean);
          return (
            <div key={post.id} className="rounded-xl border border-line bg-surface p-4 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-muted">{formatTradeDate(post.createdAt, lang)}</p>
                {post.closed && (
                  <span className="rounded-full bg-line px-2 py-0.5 text-[11px] font-semibold text-muted">
                    {t.closed}
                  </span>
                )}
              </div>

              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-[11px] font-semibold text-muted">{t.offering}</p>
                  <div className="mt-1 flex gap-1.5">
                    {offerCards.map(
                      (card) =>
                        card && (
                          <div key={card.id} className="relative h-14 w-10 overflow-hidden rounded bg-background">
                            <Image src={card.image} alt={card.name} fill sizes="40px" className="object-contain" />
                          </div>
                        )
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-muted">{t.wanted}</p>
                  <div className="mt-1 flex gap-1.5">
                    {wantCards.map(
                      (card) =>
                        card && (
                          <div key={card.id} className="relative h-14 w-10 overflow-hidden rounded bg-background">
                            <Image src={card.image} alt={card.name} fill sizes="40px" className="object-contain" />
                          </div>
                        )
                    )}
                  </div>
                </div>
              </div>

              <p className="mt-2 text-xs text-muted">{t.comments}: {post.commentCount}</p>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setEditingId(editingId === post.id ? null : post.id)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-accent/40"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  {t.edit}
                </button>
                <button
                  type="button"
                  onClick={() => void toggleClosed(post)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-accent/40"
                >
                  {post.closed ? <RotateCcw className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                  {post.closed ? t.reopen : t.close}
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete(post.id)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:border-red-300 hover:bg-red-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {t.delete}
                </button>
              </div>

              {editingId === post.id && (
                <EditForm
                  post={post}
                  cards={cards}
                  typeOptions={typeOptions}
                  rarityOptions={rarityOptions}
                  lang={lang}
                  onCancel={() => setEditingId(null)}
                  onSaved={(updated) => {
                    updateLocal(updated);
                    setEditingId(null);
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}

export function MyTradesPageClient(props: {
  cards: CardOption[];
  typeOptions: Option[];
  rarityOptions: Option[];
  lang: Lang;
}) {
  return (
    <RequireAuth>
      <MyTradesContent {...props} />
    </RequireAuth>
  );
}
