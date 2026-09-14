import Link from "next/link";
import type { Card } from "@/types/card";
import { getCardImageUrl } from "@/lib/getCardImage";
import { getJapaneseName, getJapanesePackName, getJapaneseSeriesName } from "@/lib/nameJa";
import { TypeBadge } from "@/components/TypeBadge";
import { RarityBadge } from "@/components/RarityBadge";
import { ImageWithFallback } from "@/components/ImageWithFallback";
import { WishlistButton } from "@/components/WishlistButton";
import type { Lang } from "@/lib/i18n/lang";

/**
 * カード一覧の1マス分。画像を最も大きく、主役として表示する。
 */
export function CardTile({
  card,
  lang = "ja",
  caption,
}: {
  card: Card;
  lang?: Lang;
  /** 「注目カード」など、運営コメントを添えたい時だけ渡す */
  caption?: string;
}) {
  const displayName = getJapaneseName(card, lang) ?? card.name;

  return (
    <div className="group relative flex flex-col rounded-xl border border-line bg-surface p-2 shadow-xs transition duration-200 hover:-translate-y-1 hover:border-accent/40 hover:shadow-md">
      <Link href={`/cards/${card.id}`} className="flex flex-col">
        <div className="relative aspect-[245/342] w-full overflow-hidden rounded-lg bg-background">
          <ImageWithFallback
            src={getCardImageUrl(card)}
            alt={displayName}
            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 22vw, 16vw"
            className="object-contain transition group-hover:scale-[1.03]"
          />
        </div>

        <div className="mt-2 flex flex-col gap-1">
          <p className="truncate text-sm font-semibold text-foreground">{displayName}</p>

          <div className="flex flex-wrap items-center gap-1">
            <TypeBadge type={card.subtype} lang={lang} />
            {card.health != null && (
              <span className="text-xs text-muted">HP{card.health}</span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <RarityBadge rarity={card.rarity} shiny={card.shiny} lang={lang} />
            <p className="truncate text-xs text-muted">
              {getJapaneseSeriesName(card.setCode, card.setName, lang)}
            </p>
          </div>
          <p className="truncate text-xs text-muted">{getJapanesePackName(card.pack, lang)}</p>
          {caption && <p className="line-clamp-2 text-xs text-accent-strong">{caption}</p>}
        </div>
      </Link>
      <div className="absolute right-3 top-3">
        <WishlistButton cardId={card.id} />
      </div>
    </div>
  );
}
