"use client";

import { useMemo, useState, type FormEvent } from "react";
import { ArrowRight, CheckCircle2, ImageIcon, NotebookPen, RefreshCw, Send, Star, UserRound } from "lucide-react";
import { CardPicker } from "@/components/CardPicker";
import { TradeShareImageModal } from "@/components/TradeShareImageModal";
import { createTradePost, MAX_CARDS_PER_SIDE, type CardOption } from "@/lib/trade";
import type { Option } from "@/lib/filterOptions";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { getDict } from "@/lib/i18n/dict";

const MEMO_MAX = 200;
const FRIEND_ID_LENGTH = 16;
const FRIEND_ID_PATTERN = /^\d{16}$/;

interface PostedSnapshot {
  offerCards: CardOption[];
  wantCards: CardOption[];
  friendId: string;
  memo: string;
}

/** トレード募集の投稿フォーム(Trade Composer) */
export function TradeComposer({
  cards,
  typeOptions,
  rarityOptions,
}: {
  cards: CardOption[];
  typeOptions: Option[];
  rarityOptions: Option[];
}) {
  const lang = useLang();
  const t = getDict(lang).trade.composer;
  const shareT = getDict(lang).trade.shareImage;
  // メモ欄のクリックで挿入できる定型文。自由記述と組み合わせて使える
  // (トレードはゲーム仕様上そもそも同レアリティ同士でしか成立しないため、「同レア希望」は候補に含めない)
  const MEMO_PRESETS = t.memoPresets;
  const [friendId, setFriendId] = useState("");
  const [offerCardIds, setOfferCardIds] = useState<string[]>([]);
  const [wantCardIds, setWantCardIds] = useState<string[]>([]);
  const [memo, setMemo] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [postedSnapshot, setPostedSnapshot] = useState<PostedSnapshot | null>(null);

  const cardMap = useMemo(() => new Map(cards.map((card) => [card.id, card])), [cards]);
  const resolveCards = (ids: string[]) =>
    ids.map((id) => cardMap.get(id)).filter((c): c is CardOption => Boolean(c));

  // 定型文チップ: 既存の入力の後ろに追記する(自由記述と組み合わせられるように)
  function addMemoPreset(preset: string) {
    setMemo((prev) => {
      const trimmedPrev = prev.trim();
      const next = trimmedPrev ? `${trimmedPrev}\n${preset}` : preset;
      return next.slice(0, MEMO_MAX);
    });
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    // bot対策: 人間には見えない欄が埋まっていたら投稿を無視する
    if (honeypot) return;

    const trimmedFriendId = friendId.trim();
    if (!FRIEND_ID_PATTERN.test(trimmedFriendId)) {
      setError(t.friendIdError(String(FRIEND_ID_LENGTH)));
      return;
    }
    // カードを1枚も選ばずに投稿することも許可している(「友達募集です。」のように、
    // トレードではなくフレンド募集目的で使う運用も想定しているため)。

    const trimmedMemo = memo.trim().slice(0, MEMO_MAX);

    setSubmitting(true);
    try {
      await createTradePost({
        friendId: trimmedFriendId,
        offerCardIds,
        wantCardIds,
        memo: trimmedMemo,
      });
      setPostedSnapshot({
        offerCards: resolveCards(offerCardIds),
        wantCards: resolveCards(wantCardIds),
        friendId: trimmedFriendId,
        memo: trimmedMemo,
      });
      setShareModalOpen(true);
      setFriendId("");
      setOfferCardIds([]);
      setWantCardIds([]);
      setMemo("");
    } catch {
      setError(t.postError);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="relative overflow-hidden rounded-3xl border border-line bg-surface p-6 shadow-md sm:p-8"
    >
      <div className="grid gap-6 sm:grid-cols-2 sm:gap-10">
        <CardPicker
          label={t.offerCardsLabel}
          hint={t.cardHint}
          icon={Send}
          accentGradient="from-violet-500 to-indigo-500"
          cards={cards}
          typeOptions={typeOptions}
          rarityOptions={rarityOptions}
          value={offerCardIds}
          onChange={setOfferCardIds}
          max={MAX_CARDS_PER_SIDE}
        />
        <CardPicker
          label={t.wantCardsLabel}
          hint={t.cardHint}
          icon={Star}
          accentGradient="from-teal-400 to-cyan-500"
          cards={cards}
          typeOptions={typeOptions}
          rarityOptions={rarityOptions}
          value={wantCardIds}
          onChange={setWantCardIds}
          max={MAX_CARDS_PER_SIDE}
        />
      </div>

      {/* メモ・フレンドID・投稿ボタンは、カード追加枠と違って横に並べる必要が無いため、
          1列で中央寄せにして縦に積んでいる(その分、上のカード追加枠が横幅を広く使える)。 */}
      <div className="mx-auto mt-6 flex max-w-xl flex-col items-center gap-6">
        <div className="w-full">
          <label className="mb-1.5 flex items-center justify-start gap-2 text-sm font-semibold text-foreground">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-teal-400 to-emerald-500 text-white">
              <NotebookPen className="h-3.5 w-3.5" />
            </span>
            {t.memoLabel}
            <span className="text-xs font-normal text-muted">{t.memoOptional}</span>
          </label>
          <div className="mb-1.5 flex flex-wrap justify-start gap-1.5">
            {MEMO_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => addMemoPreset(preset)}
                className="rounded-full border border-line bg-surface px-2.5 py-1 text-xs text-muted transition-colors duration-150 hover:border-accent/40 hover:text-accent"
              >
                {preset}
              </button>
            ))}
          </div>
          <textarea
            value={memo}
            onChange={(event) => setMemo(event.target.value)}
            maxLength={MEMO_MAX}
            rows={2}
            placeholder={t.memoPlaceholder}
            className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-foreground shadow-xs focus:border-accent/60 focus:outline-none"
          />
        </div>

        <div className="w-full">
          <label className="mb-1.5 flex items-center justify-start gap-2 text-sm font-semibold text-foreground">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 text-white">
              <UserRound className="h-3.5 w-3.5" />
            </span>
            {t.friendIdLabel}
            <span className="text-red-500" aria-hidden="true">
              *
            </span>
            <span className="sr-only">{t.friendIdRequired}</span>
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={friendId}
            onChange={(event) =>
              setFriendId(event.target.value.replace(/\D/g, "").slice(0, FRIEND_ID_LENGTH))
            }
            placeholder={t.friendIdPlaceholder(String(FRIEND_ID_LENGTH))}
            maxLength={FRIEND_ID_LENGTH}
            className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-left text-sm text-foreground shadow-xs focus:border-accent/60 focus:outline-none"
          />
          <p className="mt-1.5 text-left text-xs text-muted">{t.friendIdHint}</p>
        </div>

        <input
          type="text"
          value={honeypot}
          onChange={(event) => setHoneypot(event.target.value)}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="hidden"
        />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-teal-400 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-500/20 transition-opacity duration-150 hover:opacity-90 disabled:opacity-50"
        >
          <RefreshCw className="h-4 w-4" />
          {submitting ? t.submitting : t.submit}
          <ArrowRight className="h-4 w-4" />
        </button>

        {postedSnapshot && (
          <div className="w-full rounded-2xl border border-accent/20 bg-accent/5 p-5 text-center">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 via-violet-500 to-teal-400 text-white">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <p className="mt-3 text-sm font-bold text-foreground">{t.postedTitle}</p>
            <p className="mt-1 text-xs text-muted">{t.postedDescription}</p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setShareModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-teal-400 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-500/20 transition-opacity duration-150 hover:opacity-90"
              >
                <ImageIcon className="h-4 w-4" />
                {shareT.button}
              </button>
              <button
                type="button"
                onClick={() => setPostedSnapshot(null)}
                className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-5 py-2.5 text-sm font-semibold text-foreground shadow-xs transition-colors duration-150 hover:border-accent/40 hover:bg-surface-hover"
              >
                {t.postAnother}
              </button>
            </div>
          </div>
        )}
      </div>

      {shareModalOpen && postedSnapshot && (
        <TradeShareImageModal
          offerCards={postedSnapshot.offerCards}
          wantCards={postedSnapshot.wantCards}
          friendId={postedSnapshot.friendId}
          memo={postedSnapshot.memo}
          onClose={() => setShareModalOpen(false)}
        />
      )}

      {/* 右下の飾り文字。Heroの「GOOD CARDS / GOOD FRIENDS」と対になる装飾で、機能は持たない */}
      <p className="pointer-events-none absolute right-6 bottom-6 hidden text-[10px] font-semibold tracking-[0.3em] text-muted/50 sm:block">
        COLLECT / TRADE / PLAY TOGETHER
      </p>
    </form>
  );
}
