import Image from "next/image";
import { Minus } from "lucide-react";
import type { DeckBrowserCard } from "@/lib/deckBrowserCards";
import { TypeBadge } from "@/components/TypeBadge";
import { RarityBadge } from "@/components/RarityBadge";
import { getDict } from "@/lib/i18n/dict";
import type { Lang } from "@/lib/i18n/lang";

/**
 * Deck Card Browser内の1枚分の選択用タイル。CardTile/CardOptionTileと見た目は近いが、
 * 詳細ページへのLinkではなく「タップで選択数を増減するボタン」として振る舞う。
 * 選択中の枚数(0/1/2)と、ログイン中は所持数も表示する。
 *
 * card.displayName/card.imageはサーバー側(lib/deckBrowserCards.ts)で既に日本語化・解決済みのため、
 * ここではgetJapaneseName/getCardImageUrlを呼ばない
 * (クライアントバンドルに日本語名マッピングJSONを含めずに済ませるため)。
 */
export function DeckCardBrowserTile({
  card,
  lang = "ja",
  count,
  maxPerCard,
  ownedQuantity,
  onAdd,
  onRemove,
}: {
  card: DeckBrowserCard;
  lang?: Lang;
  /** このカードが現在デッキに何枚入っているか(0〜maxPerCard) */
  count: number;
  maxPerCard: number;
  /** ログイン中の所持数。未ログインの場合はnull(表示しない) */
  ownedQuantity: number | null;
  onAdd: () => void;
  onRemove: () => void;
}) {
  const t = getDict(lang).decks.browser;
  const isMaxed = count >= maxPerCard;

  return (
    <div
      className={`group relative flex flex-col rounded-xl border p-2 shadow-xs transition duration-150 ${
        count > 0 ? "border-accent bg-accent/5" : "border-line bg-surface hover:border-accent/40"
      }`}
    >
      <button
        type="button"
        onClick={onAdd}
        disabled={isMaxed}
        className="flex flex-col text-left disabled:cursor-not-allowed"
      >
        <div className="relative aspect-[245/342] w-full overflow-hidden rounded-lg bg-background">
          <Image
            src={card.image}
            alt={card.displayName}
            fill
            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 22vw, 16vw"
            className="object-contain"
          />
        </div>
        <div className="mt-2 flex flex-col gap-1">
          <p className="truncate text-xs font-semibold text-foreground">{card.displayName}</p>
          <div className="flex items-center gap-1 overflow-hidden">
            <TypeBadge type={card.type} lang={lang} />
            <RarityBadge rarity={card.rarity} shiny={card.shiny} lang={lang} />
          </div>
          {ownedQuantity != null && (
            <p className="truncate text-[10px] text-muted">{t.ownedBadge(String(ownedQuantity))}</p>
          )}
        </div>
      </button>

      {count > 0 && (
        <>
          <span className="absolute top-1 left-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-accent px-1.5 text-xs font-bold text-white shadow-sm">
            ×{count}
          </span>
          <button
            type="button"
            onClick={onRemove}
            aria-label="−1"
            className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-red-500"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
        </>
      )}
    </div>
  );
}
