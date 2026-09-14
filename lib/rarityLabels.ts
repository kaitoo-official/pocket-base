import type { Lang } from "@/lib/i18n/lang";

// レアリティの正式な呼び方(コミュニティ・公式で使われる名称)。
// ☆・☆☆は、同じ記号でも「色違い(shiny)」のカードだけ別名になる。
const RARITY_LABELS: Record<string, string> = {
  "◊": "ダイヤ1",
  "◊◊": "ダイヤ2",
  "◊◊◊": "ダイヤ3",
  "◊◊◊◊": "ダイヤ4",
  "☆": "星1",
  "☆☆": "星2",
  "☆☆☆": "星3",
  "Crown Rare": "クラウン",
  Promo: "プロモ",
};

const SHINY_RARITY_LABELS: Record<string, string> = {
  "☆": "色違い1",
  "☆☆": "色違い2",
};

const RARITY_LABELS_EN: Record<string, string> = {
  "◊": "Diamond 1",
  "◊◊": "Diamond 2",
  "◊◊◊": "Diamond 3",
  "◊◊◊◊": "Diamond 4",
  "☆": "Star 1",
  "☆☆": "Star 2",
  "☆☆☆": "Star 3",
  "Crown Rare": "Crown Rare",
  Promo: "Promo",
};

const SHINY_RARITY_LABELS_EN: Record<string, string> = {
  "☆": "Shiny 1",
  "☆☆": "Shiny 2",
};

export function getRarityLabel(rarity: string, shiny = false, lang: Lang = "ja"): string {
  if (lang === "en") {
    if (shiny && SHINY_RARITY_LABELS_EN[rarity]) return SHINY_RARITY_LABELS_EN[rarity];
    return RARITY_LABELS_EN[rarity] ?? rarity;
  }
  if (shiny && SHINY_RARITY_LABELS[rarity]) return SHINY_RARITY_LABELS[rarity];
  return RARITY_LABELS[rarity] ?? rarity;
}

export interface RarityImage {
  src: string;
  width: number;
  height: number;
}

// レアリティのバッジ画像(ダイヤ・星は個数分の記号がまとめて描かれた1枚の画像)。
// 元画像の余白をトリミング済みなので、幅と高さの比率がレアリティごとに異なる。
const RARITY_IMAGES: Record<string, RarityImage> = {
  "◊": { src: "/images/rarity/diamond1.png", width: 819, height: 819 },
  "◊◊": { src: "/images/rarity/diamond2.png", width: 869, height: 869 },
  "◊◊◊": { src: "/images/rarity/diamond3.png", width: 1070, height: 1070 },
  "◊◊◊◊": { src: "/images/rarity/diamond4.png", width: 1152, height: 1152 },
  "☆": { src: "/images/rarity/star1.png", width: 787, height: 787 },
  "☆☆": { src: "/images/rarity/star2.png", width: 864, height: 864 },
  "☆☆☆": { src: "/images/rarity/star3.png", width: 1174, height: 1174 },
  "Crown Rare": { src: "/images/rarity/crown.png", width: 895, height: 895 },
  Promo: { src: "/images/rarity/promo.png", width: 1254, height: 1254 },
};

// 色違い(shiny)版の☆・☆☆だけ、専用の虹色バッジ画像に差し替える
const SHINY_RARITY_IMAGES: Record<string, RarityImage> = {
  "☆": { src: "/images/rarity/shiny1.png", width: 787, height: 787 },
  "☆☆": { src: "/images/rarity/shiny2.png", width: 1047, height: 1047 },
};

/** レアリティのバッジ画像を返す。未知のレアリティ等、専用画像が無い場合はundefined */
export function getRarityImage(rarity: string, shiny = false): RarityImage | undefined {
  if (shiny && SHINY_RARITY_IMAGES[rarity]) return SHINY_RARITY_IMAGES[rarity];
  return RARITY_IMAGES[rarity];
}
