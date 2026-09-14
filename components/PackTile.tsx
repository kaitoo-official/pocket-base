import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Expansion, Pack } from "@/types/card";
import { getPackImageUrl } from "@/lib/getCardImage";
import { getPackDisplayLabel, getJapaneseSeriesName } from "@/lib/nameJa";
import { ImageWithFallback } from "@/components/ImageWithFallback";
import type { Lang } from "@/lib/i18n/lang";

/** パック一覧の1マス分 */
export function PackTile({
  pack,
  expansion,
  cardCount,
  lang = "ja",
}: {
  pack: Pack;
  expansion: Expansion;
  cardCount: number;
  lang?: Lang;
}) {
  // パックが1種類しか無いシリーズは、パック名(=シリーズ名)だけを表示する
  const isOnlyPack = pack.name === "Booster";
  const label = getPackDisplayLabel(pack.name, expansion.id, expansion.name, lang);

  return (
    <Link
      href={`/packs/${pack.id}`}
      className="group flex flex-col rounded-xl border border-line bg-surface p-2 shadow-xs transition duration-200 hover:-translate-y-1 hover:border-accent/40 hover:shadow-md"
    >
      {/* 実際のパック画像の比率(334:644、縦長)に合わせた枠 */}
      <div className="relative aspect-[334/644] w-full overflow-hidden rounded-lg bg-background">
        <ImageWithFallback
          src={getPackImageUrl(pack)}
          alt={label}
          sizes="(max-width: 640px) 45vw, (max-width: 1024px) 22vw, 16vw"
          className="object-contain transition group-hover:scale-[1.03]"
        />
      </div>
      <div className="mt-2">
        <p className="truncate text-sm font-semibold text-foreground">{label}</p>
        {!isOnlyPack && (
          <p className="truncate text-xs text-muted">
            {getJapaneseSeriesName(expansion.id, expansion.name, lang)}
          </p>
        )}
        <p className="text-xs text-muted">
          {lang === "en" ? `${cardCount.toLocaleString()} cards` : `${cardCount.toLocaleString()}枚`}
        </p>
        <p className="mt-1 flex items-center gap-1 text-xs font-medium text-accent opacity-0 transition-opacity group-hover:opacity-100">
          {lang === "en" ? "View cards" : "カードを見る"}
          <ArrowRight className="h-3 w-3" />
        </p>
      </div>
    </Link>
  );
}
