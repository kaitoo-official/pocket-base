"use client";

import { useMemo } from "react";
import Image from "next/image";
import { X, Pencil } from "lucide-react";
import type { Deck } from "@/lib/decks";
import type { DeckBrowserCard } from "@/lib/deckBrowserCards";
import { TypeIcon } from "@/components/TypeIcon";
import { getTypeLabel } from "@/lib/typeLabels";
import { getDict } from "@/lib/i18n/dict";
import type { Lang } from "@/lib/i18n/lang";

const MAX_DECK_CARDS = 20;

/**
 * 保存済みデッキの中身を閲覧専用で確認するモーダル。編集画面を開かずに
 * 「このデッキに何が入っているか」をすぐ見られるようにする。
 * 新しいカードデータの取得は行わず、DecksPageClientが既に持っているDeckBrowserCardの
 * Map(cardMapByIdとして渡される)をそのまま参照する(/decksの転送量を増やさないため)。
 */
export function DeckPreviewModal({
  open,
  onClose,
  onEdit,
  deck,
  cardMap,
  lang,
}: {
  open: boolean;
  onClose: () => void;
  onEdit: () => void;
  deck: Deck | null;
  cardMap: Map<string, DeckBrowserCard>;
  lang: Lang;
}) {
  const t = getDict(lang).decks;
  const tp = t.preview;

  // フック呼び出しの順序を一定に保つため、early returnより前にuseMemoを置く
  const uniqueIds = useMemo(() => (deck ? [...new Set(deck.cards)] : []), [deck]);

  if (!open || !deck) return null;

  function countOf(id: string): number {
    return deck ? deck.cards.filter((v) => v === id).length : 0;
  }

  return (
    <div className="theme-reset-light fixed inset-0 z-[100] flex items-stretch justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-[#0B2D5B]/40" onClick={onClose} />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={tp.title}
        className="relative flex h-[100dvh] w-full flex-col overflow-hidden bg-surface shadow-xl sm:h-[85vh] sm:max-w-4xl sm:rounded-2xl sm:border sm:border-line"
      >
        {/* ヘッダー: デッキ名・枚数・閉じるボタン。
            フルスクリーン表示(h-[100dvh])のため、iOSのノッチ/ステータスバーに重ならないよう
            safe-area-inset-topぶんの余白を足す(SiteHeader.tsxと同じ方式) */}
        <div className="flex shrink-0 items-center justify-between border-b border-line px-4 py-3 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{deck.deckName}</p>
            <p className="text-xs text-muted">
              {t.browser.deckCount(String(deck.cards.length), String(MAX_DECK_CARDS))}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={tp.close}
            className="cursor-pointer rounded-full p-1 text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* エネルギータイプ */}
        {deck.energyTypes.length > 0 && (
          <div className="shrink-0 border-b border-line px-4 py-3">
            <p className="mb-1.5 text-xs font-semibold text-muted">{tp.energyTypes}</p>
            <div className="flex flex-wrap gap-2">
              {deck.energyTypes.map((type) => (
                <span
                  key={type}
                  className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1 text-xs font-medium text-foreground"
                >
                  <TypeIcon type={type} className="h-4 w-4" />
                  {getTypeLabel(type, lang)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 収録カード(同じカードは1枚の画像+×N表示にまとめる) */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <p className="mb-2 text-xs font-semibold text-muted">{tp.cardsInDeck}</p>
          {uniqueIds.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted">{t.empty}</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {uniqueIds.map((id) => {
                const card = cardMap.get(id);
                if (!card) return null;
                const count = countOf(id);
                return (
                  <div
                    key={id}
                    className="relative flex flex-col rounded-xl border border-line bg-surface p-2 shadow-xs"
                  >
                    <span className="absolute top-1 left-1 z-10 flex h-6 min-w-6 items-center justify-center rounded-full bg-accent px-1.5 text-xs font-bold text-white shadow-sm">
                      ×{count}
                    </span>
                    <div className="relative aspect-[245/342] w-full overflow-hidden rounded-lg bg-background">
                      <Image
                        src={card.image}
                        alt={card.displayName}
                        fill
                        sizes="(max-width: 640px) 45vw, (max-width: 1024px) 22vw, 16vw"
                        className="object-contain"
                      />
                    </div>
                    <p className="mt-2 truncate text-xs font-semibold text-foreground">{card.displayName}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* フッター: 編集・閉じる */}
        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-line px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-hover"
          >
            {tp.close}
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-accent-strong"
          >
            <Pencil className="h-4 w-4" />
            {tp.editDeck}
          </button>
        </div>
      </div>
    </div>
  );
}
