// タイプ(ポケモンのエネルギータイプ／トレーナーズの分類)に関する表示情報。
// TypeBadge(一覧・詳細での表示)と、フィルター画面の両方から使う。

import type { Lang } from "@/lib/i18n/lang";

// 「グッズ」の中でも化石カード(Helix Fossil等)だけを区別するための、擬似的なタイプ値。
// カード自体のsubtypeは"Item"のままで、フィルターの選択肢としてだけ使う。
export const ITEM_FOSSIL_TYPE = "ItemFossil";

// アイコンの丸背景用。参考画像に合わせた、はっきりした色。
export const TYPE_ICON_BG: Record<string, string> = {
  Grass: "bg-green-600",
  Fire: "bg-red-500",
  Water: "bg-sky-500",
  Lightning: "bg-yellow-400",
  Psychic: "bg-purple-600",
  Fighting: "bg-orange-600",
  Darkness: "bg-slate-800",
  Metal: "bg-zinc-500",
  Dragon: "bg-lime-700",
  Colorless: "bg-gray-400",
  Item: "bg-cyan-600",
  [ITEM_FOSSIL_TYPE]: "bg-stone-500",
  Supporter: "bg-rose-500",
  Tool: "bg-teal-600",
  Stadium: "bg-emerald-600",
};

export const DEFAULT_TYPE_ICON_BG = "bg-gray-400";

// タイプ(エネルギータイプ+トレーナーズの分類)の、公式に近い見た目のバッジ画像。
export const TYPE_IMAGES: Record<string, string> = {
  Grass: "/images/types/grass.png",
  Fire: "/images/types/fire.png",
  Water: "/images/types/water.png",
  Lightning: "/images/types/lightning.png",
  Psychic: "/images/types/psychic.png",
  Fighting: "/images/types/fighting.png",
  Darkness: "/images/types/darkness.png",
  Metal: "/images/types/metal.png",
  Dragon: "/images/types/dragon.png",
  Colorless: "/images/types/colorless.png",
  Item: "/images/types/item.png",
  [ITEM_FOSSIL_TYPE]: "/images/types/item-fossil.png",
  Supporter: "/images/types/supporter.png",
  Tool: "/images/types/tool.png",
  Stadium: "/images/types/stadium.png",
};

// ポケモンカードゲーム(ポケポケ含む)で実際に使われている日本語表記
export const TYPE_LABELS_JA: Record<string, string> = {
  Grass: "草",
  Fire: "炎",
  Water: "水",
  Lightning: "雷",
  Psychic: "超",
  Fighting: "闘",
  Darkness: "悪",
  Metal: "鋼",
  Dragon: "ドラゴン",
  Colorless: "無色",
  Item: "グッズ",
  [ITEM_FOSSIL_TYPE]: "グッズ(化石)",
  Supporter: "サポート",
  Tool: "ポケモンのどうぐ",
  Stadium: "スタジアム",
};

// フィルターのチェックボックスを並べる時の順序(ゲーム内の並びに近い順)
export const TYPE_ORDER = [
  "Grass",
  "Fire",
  "Water",
  "Lightning",
  "Psychic",
  "Fighting",
  "Darkness",
  "Metal",
  "Dragon",
  "Colorless",
  "Item",
  ITEM_FOSSIL_TYPE,
  "Supporter",
  "Tool",
  "Stadium",
];

// 英語は元データの値がほぼそのまま使えるが、疑似タイプ(化石)とTool/Stadiumだけ言い回しを整える
const TYPE_LABELS_EN: Record<string, string> = {
  [ITEM_FOSSIL_TYPE]: "Item (Fossil)",
  Tool: "Pokémon Tool",
};

export function getTypeLabel(type: string, lang: Lang = "ja"): string {
  if (lang === "en") return TYPE_LABELS_EN[type] ?? type;
  return TYPE_LABELS_JA[type] ?? type;
}
