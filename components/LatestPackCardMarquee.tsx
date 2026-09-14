import Link from "next/link";
import type { CSSProperties } from "react";
import type { Card } from "@/types/card";
import { getCardImageUrl } from "@/lib/getCardImage";
import { getJapaneseName } from "@/lib/nameJa";
import { ImageWithFallback } from "@/components/ImageWithFallback";
import type { Lang } from "@/lib/i18n/lang";

/**
 * 「最新パック」セクションの右側に添える、収録カードのプレビュー帯。
 * カードを横一列に並べ、CSSアニメーションだけで左に流れ続けるようにしている
 * (操作は必要ない飾り要素なので、Heroのカルーセルのようなクリック/ドラッグ対応は持たせない)。
 * 継ぎ目なくループさせるため、同じ並びを2回連続で描画している。
 */
export function LatestPackCardMarquee({ cards, lang = "ja" }: { cards: Card[]; lang?: Lang }) {
  if (cards.length === 0) return null;

  const track = [...cards, ...cards];

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface p-4">
      <p className="text-xs font-semibold text-muted">
        {lang === "en" ? "Check out the cards in this pack" : "収録カードをチェック"}
      </p>
      <div className="mt-3 [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
        <div
          className="marquee-track flex w-max gap-3"
          style={{ "--marquee-duration": `${cards.length * 3.5}s` } as CSSProperties}
        >
          {track.map((card, index) => {
            const displayName = getJapaneseName(card, lang) ?? card.name;
            return (
              // 幅はHome側のパックタイル(w-36 sm:w-40)に合わせている。
              // パックの隣に並ぶ帯なので、カードもパックと同じ横幅で見せたい。
              <Link
                key={`${card.id}-${index}`}
                href={`/cards/${card.id}`}
                className="w-36 shrink-0 transition-opacity hover:opacity-80 sm:w-40"
              >
                <div className="relative aspect-[245/342] w-full overflow-hidden rounded-lg bg-background">
                  <ImageWithFallback
                    src={getCardImageUrl(card)}
                    alt={displayName}
                    sizes="(max-width: 640px) 144px, 160px"
                    className="object-contain"
                  />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
