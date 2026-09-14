import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import type { CardOption } from "@/lib/trade";
import { TypeBadge } from "@/components/TypeBadge";
import { RarityBadge } from "@/components/RarityBadge";
import type { Lang } from "@/lib/i18n/lang";

/**
 * Wishlist・マイコレクション・デッキ編集など、CardOption(簡易カード情報)を
 * 一覧表示する画面で共通して使うタイル。右上にaction(削除ボタン等)を重ねられる。
 */
export function CardOptionTile({
  card,
  lang = "ja",
  action,
}: {
  card: CardOption;
  lang?: Lang;
  action?: ReactNode;
}) {
  return (
    <div className="group relative flex flex-col rounded-xl border border-line bg-surface p-2 shadow-xs transition duration-200 hover:-translate-y-1 hover:border-accent/40 hover:shadow-md">
      <Link href={`/cards/${card.id}`} className="flex flex-col">
        <div className="relative aspect-[245/342] w-full overflow-hidden rounded-lg bg-background">
          <Image
            src={card.image}
            alt={card.name}
            fill
            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 22vw, 16vw"
            className="object-contain transition group-hover:scale-[1.03]"
          />
        </div>
        <div className="mt-2 flex flex-col gap-1">
          <p className="truncate text-sm font-semibold text-foreground">{card.name}</p>
          <div className="flex items-center gap-1.5">
            <TypeBadge type={card.type} lang={lang} />
            <RarityBadge rarity={card.rarity} shiny={card.shiny} lang={lang} />
          </div>
        </div>
      </Link>
      {action && <div className="absolute right-2 top-2">{action}</div>}
    </div>
  );
}
