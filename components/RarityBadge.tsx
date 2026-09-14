import { getRarityLabel } from "@/lib/rarityLabels";
import { RarityIcon } from "@/components/RarityIcon";
import type { Lang } from "@/lib/i18n/lang";

/** レアリティを、専用のバッジ画像でピル形状に表示する */
export function RarityBadge({
  rarity,
  shiny = false,
  lang = "ja",
}: {
  rarity: string;
  shiny?: boolean;
  lang?: Lang;
}) {
  const label = getRarityLabel(rarity, shiny, lang);
  return (
    <span title={label} className="inline-flex h-6 items-center rounded-full bg-surface px-2">
      <RarityIcon rarity={rarity} shiny={shiny} className="h-4" />
    </span>
  );
}
