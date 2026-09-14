// カードの「タイプ」(ポケモンのエネルギータイプ、またはトレーナーズの分類)を
// 絵柄アイコン+ラベルのピル形状で表示する部品。
import { getTypeLabel } from "@/lib/typeLabels";
import { TypeIcon } from "@/components/TypeIcon";
import type { Lang } from "@/lib/i18n/lang";

export function TypeBadge({ type, lang = "ja" }: { type: string; lang?: Lang }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-surface py-0.5 pr-2.5 pl-0.5 text-xs font-medium text-foreground">
      <TypeIcon type={type} className="h-5 w-5" />
      {getTypeLabel(type, lang)}
    </span>
  );
}
