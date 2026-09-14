// カードの「タイプ」(ポケモンのエネルギータイプ、またはトレーナーズの分類)を
// まるいバッジとして表示する部品。エネルギータイプは用意した画像バッジをそのまま使い、
// 画像が無いトレーナーズの分類(グッズ・サポート等)は、色付き円+絵柄アイコンで代用する。
import Image from "next/image";
import {
  Package,
  Bone,
  Users,
  Wrench,
  Landmark,
  Star,
  type LucideIcon,
} from "lucide-react";
import { ITEM_FOSSIL_TYPE, TYPE_ICON_BG, DEFAULT_TYPE_ICON_BG, TYPE_IMAGES } from "@/lib/typeLabels";

const FALLBACK_ICONS: Record<string, LucideIcon> = {
  Item: Package,
  [ITEM_FOSSIL_TYPE]: Bone,
  Supporter: Users,
  Tool: Wrench,
  Stadium: Landmark,
};

export function TypeIcon({ type, className = "h-5 w-5" }: { type: string; className?: string }) {
  const image = TYPE_IMAGES[type];

  if (image) {
    return (
      <span className={`relative inline-block shrink-0 overflow-hidden rounded-full ${className}`}>
        <Image src={image} alt="" fill sizes="40px" className="object-cover" />
      </span>
    );
  }

  const Icon = FALLBACK_ICONS[type] ?? Star;
  const bg = TYPE_ICON_BG[type] ?? DEFAULT_TYPE_ICON_BG;

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full ${bg} ${className}`}
    >
      <Icon className="h-[60%] w-[60%] text-white" />
    </span>
  );
}
