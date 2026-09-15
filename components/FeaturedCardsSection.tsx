import Link from "next/link";
import type { CSSProperties } from "react";
import { FEATURED_CARDS } from "@/lib/homeShowcase";
import { getCardById } from "@/lib/data";
import { getCardImageUrl } from "@/lib/getCardImage";
import { getJapaneseName } from "@/lib/nameJa";
import { ImageWithFallback } from "@/components/ImageWithFallback";
import { SectionHeader } from "@/components/SectionHeader";
import { getDict } from "@/lib/i18n/dict";
import type { Lang } from "@/lib/i18n/lang";

/**
 * ホーム画面の「注目カード」セクション。lib/homeShowcase.ts で手動キュレーションした
 * カードを紹介する(実際の使用率データは無いため、運営が選んだ紹介という位置づけ)。
 * 「最新パック」のカードプレビュー帯(LatestPackCardMarquee)と同じく、カード画像単体を
 * CSSアニメーションで左に流れ続けるマーキー表示にしている
 * (継ぎ目なくループさせるため、同じ並びを2回連続で描画)。
 * FEATURED_CARDSが空、またはカードIDが解決できない間は何も表示しない。
 */
export function FeaturedCardsSection({ lang }: { lang: Lang }) {
  const t = getDict(lang).home;

  const cards = FEATURED_CARDS.flatMap((entry) => {
    const card = getCardById(entry.cardId);
    return card ? [card] : [];
  });

  if (cards.length === 0) return null;

  const track = [...cards, ...cards];

  return (
    <section>
      <SectionHeader title={t.featuredCards} />
      <div className="mt-5 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_4%,black_96%,transparent)]">
        <div
          className="marquee-track flex w-max gap-3"
          style={{ "--marquee-duration": `${cards.length * 3.5}s` } as CSSProperties}
        >
          {track.map((card, index) => {
            const displayName = getJapaneseName(card, lang) ?? card.name;
            return (
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
    </section>
  );
}
