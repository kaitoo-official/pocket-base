import type { Card } from "@/types/card";
import type { Lang } from "@/lib/i18n/lang";
import { getAllCards, getAllExpansions } from "@/lib/data";
import { getJapanesePackName, getJapaneseSeriesName } from "@/lib/nameJa";
import { TYPE_ORDER, ITEM_FOSSIL_TYPE, getTypeLabel } from "@/lib/typeLabels";
import { getRarityLabel } from "@/lib/rarityLabels";

export interface Option {
  value: string;
  label: string;
}

export const RARITY_ORDER = ["◊", "◊◊", "◊◊◊", "◊◊◊◊", "☆", "☆☆", "☆☆☆", "Crown Rare", "Promo"];

// ☆・☆☆だけ、色違い(shiny)版が別レアリティ扱いで存在する
const SHINY_ELIGIBLE_RARITIES = new Set(["☆", "☆☆"]);
export const SHINY_SUFFIX = "-shiny";

/**
 * 色違いも含めた、公式アプリと同じレアリティの並び順。
 * ダイヤ1〜4 → 星1〜3 → 色違い1・2 → クラウン → プロモ、の順。
 * (色違いは☆・☆☆それぞれの直後ではなく、星3とクラウンの間に来る)
 */
export const RARITY_DISPLAY_ORDER = [
  "◊",
  "◊◊",
  "◊◊◊",
  "◊◊◊◊",
  "☆",
  "☆☆",
  "☆☆☆",
  `☆${SHINY_SUFFIX}`,
  `☆☆${SHINY_SUFFIX}`,
  "Crown Rare",
  "Promo",
];

/** レアリティ+色違いフラグから、RARITY_DISPLAY_ORDER上の並び順を計算する(sortCardsのレアリティ順で使用) */
export function getRaritySortIndex(rarity: string, shiny: boolean): number {
  const key = shiny && SHINY_ELIGIBLE_RARITIES.has(rarity) ? `${rarity}${SHINY_SUFFIX}` : rarity;
  const index = RARITY_DISPLAY_ORDER.indexOf(key);
  return index === -1 ? RARITY_DISPLAY_ORDER.length : index;
}

const STAGE_LABELS: Record<string, string> = {
  Basic: "たね",
  "Stage 1": "1進化",
  "Stage 2": "2進化",
};

const STAGE_LABELS_EN: Record<string, string> = {
  Basic: "Basic",
  "Stage 1": "Stage 1",
  "Stage 2": "Stage 2",
};

const CATEGORY_LABELS: Record<string, string> = {
  Pokémon: "ポケモン",
  Trainer: "トレーナーズ",
};

const CATEGORY_LABELS_EN: Record<string, string> = {
  Pokémon: "Pokémon",
  Trainer: "Trainer",
};

/**
 * フィルターの「タイプ」として扱う値を返す。
 * 化石カード(Helix Fossil等)は subtype が"Item"のままだと普通のグッズと区別できないため、
 * ここだけ特別に"ItemFossil"という擬似的な値にする。
 */
export function getEffectiveType(card: Pick<Card, "subtype" | "stage">): string {
  if (card.subtype === "Item" && card.stage != null) return ITEM_FOSSIL_TYPE;
  return card.subtype;
}

export function getTypeOptions(lang: Lang = "ja"): Option[] {
  const used = new Set(getAllCards().map((c) => getEffectiveType(c)));
  return TYPE_ORDER.filter((t) => used.has(t)).map((t) => ({
    value: t,
    label: getTypeLabel(t, lang),
  }));
}

/** レアリティの絞り込み値(例: "☆-shiny")を、元のレアリティ記号とshinyフラグに分解する */
export function parseRarityFilterValue(value: string): { rarity: string; shiny: boolean } {
  if (value.endsWith(SHINY_SUFFIX)) {
    return { rarity: value.slice(0, -SHINY_SUFFIX.length), shiny: true };
  }
  return { rarity: value, shiny: false };
}

export function getRarityOptions(lang: Lang = "ja"): Option[] {
  const cards = getAllCards();
  const used = new Set(cards.map((c) => c.rarity));
  const usedShiny = new Set(cards.filter((c) => c.shiny).map((c) => c.rarity));

  return RARITY_DISPLAY_ORDER.filter((value) => {
    const { rarity, shiny } = parseRarityFilterValue(value);
    return shiny ? usedShiny.has(rarity) : used.has(rarity);
  }).map((value) => {
    const { rarity, shiny } = parseRarityFilterValue(value);
    const label =
      rarity === "Crown Rare" || rarity === "Promo"
        ? getRarityLabel(rarity, false, lang)
        : `${rarity} ${getRarityLabel(rarity, shiny, lang)}`;
    return { value, label };
  });
}

/**
 * 与えられたカード一覧の中で実際に使われているタイプだけを対象にした、絞り込み選択肢。
 * トレード掲示板・画像メーカーのように「対象カードを先に絞ってから、その範囲でタイプ選択肢を作りたい」
 * 場面で使う(getTypeOptionsは常に全カードが対象なので、それとは別に用意している)。
 */
export function getOptionsFromCardTypes(cards: { type: string }[], lang: Lang = "ja"): Option[] {
  const used = new Set(cards.map((c) => c.type));
  return TYPE_ORDER.filter((t) => used.has(t)).map((t) => ({
    value: t,
    label: getTypeLabel(t, lang),
  }));
}

/** getOptionsFromCardTypesのレアリティ版。ラベルの記号(◊/☆)は呼び出し側でアイコン表示するため、ここでは名称だけにする */
export function getOptionsFromCardRarities(
  cards: { rarity: string; shiny: boolean }[],
  lang: Lang = "ja"
): Option[] {
  const used = new Set(cards.map((c) => c.rarity));
  const usedShiny = new Set(cards.filter((c) => c.shiny).map((c) => c.rarity));

  return RARITY_DISPLAY_ORDER.filter((value) => {
    const { rarity, shiny } = parseRarityFilterValue(value);
    return shiny ? usedShiny.has(rarity) : used.has(rarity);
  }).map((value) => {
    const { rarity, shiny } = parseRarityFilterValue(value);
    return { value, label: getRarityLabel(rarity, shiny, lang) };
  });
}

export function getCategoryOptions(lang: Lang = "ja"): Option[] {
  const labels = lang === "en" ? CATEGORY_LABELS_EN : CATEGORY_LABELS;
  return ["Pokémon", "Trainer"].map((c) => ({ value: c, label: labels[c] }));
}

export function getStageOptions(lang: Lang = "ja"): Option[] {
  const labels = lang === "en" ? STAGE_LABELS_EN : STAGE_LABELS;
  return ["Basic", "Stage 1", "Stage 2"].map((s) => ({ value: s, label: labels[s] }));
}

export function getStageLabel(stage: string, lang: Lang = "ja"): string {
  const labels = lang === "en" ? STAGE_LABELS_EN : STAGE_LABELS;
  return labels[stage] ?? stage;
}

export function getCategoryLabel(category: string, lang: Lang = "ja"): string {
  const labels = lang === "en" ? CATEGORY_LABELS_EN : CATEGORY_LABELS;
  return labels[category] ?? category;
}

// シリーズは "a1"→Aシリーズ、"b1"→Bシリーズ、"pa"/"pb"→プロモ、と接頭辞できれいに分かれている
const SERIES_GROUP_ORDER = ["Aシリーズ", "Bシリーズ", "プロモ"];
const SERIES_GROUP_LABELS_EN: Record<string, string> = {
  Aシリーズ: "A Series",
  Bシリーズ: "B Series",
  プロモ: "Promo",
};

function getSeriesGroupLabel(expansionId: string): string {
  if (expansionId.startsWith("a")) return "Aシリーズ";
  if (expansionId.startsWith("b")) return "Bシリーズ";
  return "プロモ";
}

export interface OptionGroup {
  groupLabel: string;
  options: Option[];
}

export interface ExpansionPackEntry {
  /** シリーズ(拡張パック)のID。例: "a1"。この値が「シリーズ」のフィルター値になる */
  seriesId: string;
  seriesName: string;
  /** このシリーズの中の、個別パック一覧。パックが1種類しか無いシリーズは空配列 */
  packs: Option[];
}

export interface ExpansionPackGroup {
  groupLabel: string;
  series: ExpansionPackEntry[];
}

/**
 * 「拡張パック」フィルターの選択肢を、公式アプリと同じ
 * Aシリーズ/Bシリーズ/プロモ → シリーズ → (複数あれば)個別パック、の構造で返す。
 */
export function getExpansionPackGroups(lang: Lang = "ja"): ExpansionPackGroup[] {
  return SERIES_GROUP_ORDER.map((groupLabel) => ({
    groupLabel: lang === "en" ? SERIES_GROUP_LABELS_EN[groupLabel] : groupLabel,
    series: getAllExpansions()
      .filter((exp) => getSeriesGroupLabel(exp.id) === groupLabel)
      .map((exp) => ({
        seriesId: exp.id,
        seriesName: getJapaneseSeriesName(exp.id, exp.name, lang),
        // パックが1種類しか無いシリーズは、シリーズの「すべて」と意味が重複するので個別には出さない
        packs:
          exp.packs.length > 1
            ? exp.packs.map((pack) => ({
                value: pack.id,
                label: getJapanesePackName(pack.name, lang),
              }))
            : [],
      })),
  })).filter((g) => g.series.length > 0);
}

export function getAcquisitionOptions(lang: Lang = "ja"): Option[] {
  if (lang === "en") {
    return [
      { value: "pack", label: "Pack" },
      { value: "promo", label: "Promo" },
    ];
  }
  return [
    { value: "pack", label: "パック排出" },
    { value: "promo", label: "プロモ" },
  ];
}

export function getAbilityOptions(lang: Lang = "ja"): Option[] {
  if (lang === "en") {
    return [
      { value: "has", label: "Has Ability" },
      { value: "none", label: "No Ability" },
    ];
  }
  return [
    { value: "has", label: "特性あり" },
    { value: "none", label: "特性なし" },
  ];
}

export function getCardFlagOptions(lang: Lang = "ja"): Option[] {
  if (lang === "en") {
    return [
      { value: "ex", label: "Pokémon ex" },
      { value: "mega", label: "Mega Evolution ex" },
    ];
  }
  return [
    { value: "ex", label: "ポケモンex" },
    { value: "mega", label: "メガシンカex" },
  ];
}

/** にげるエネルギーの絞り込み選択肢。トレーナーズにはこの項目自体が無いため、ポケモンのみ対象に集計する */
export function getRetreatCostOptions(): Option[] {
  const used = new Set(
    getAllCards()
      .map((c) => c.retreat)
      .filter((retreat): retreat is number => retreat != null)
  );
  return [...used].sort((a, b) => a - b).map((count) => ({ value: String(count), label: `${count}` }));
}
