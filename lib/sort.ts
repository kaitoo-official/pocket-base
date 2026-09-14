import type { Card } from "@/types/card";
import { getAllExpansions } from "@/lib/data";
import { getJapaneseName } from "@/lib/nameJa";
import { getRaritySortIndex } from "@/lib/filterOptions";
import type { Lang } from "@/lib/i18n/lang";

export type SortCriterion = "number" | "name" | "hp" | "rarity" | "newest";
export type SortDirection = "asc" | "desc";

export const SORT_OPTIONS: { value: SortCriterion; label: string; defaultDirection: SortDirection }[] = [
  { value: "number", label: "カード番号順", defaultDirection: "asc" },
  { value: "name", label: "名前順", defaultDirection: "asc" },
  { value: "hp", label: "HP順", defaultDirection: "desc" },
  { value: "rarity", label: "レアリティ順", defaultDirection: "asc" },
  { value: "newest", label: "新しい順", defaultDirection: "desc" },
];

const SORT_LABELS_EN: Record<SortCriterion, string> = {
  number: "Card Number",
  name: "Name",
  hp: "HP",
  rarity: "Rarity",
  newest: "Newest",
};

export function getSortOptions(
  lang: Lang = "ja"
): { value: SortCriterion; label: string; defaultDirection: SortDirection }[] {
  if (lang === "ja") return SORT_OPTIONS;
  return SORT_OPTIONS.map((opt) => ({ ...opt, label: SORT_LABELS_EN[opt.value] }));
}

export function parseSortCriterion(value: string | string[] | undefined): SortCriterion {
  const v = Array.isArray(value) ? value[0] : value;
  return SORT_OPTIONS.some((opt) => opt.value === v) ? (v as SortCriterion) : "number";
}

export function parseSortDirection(value: string | string[] | undefined): SortDirection {
  const v = Array.isArray(value) ? value[0] : value;
  return v === "asc" || v === "desc" ? v : "asc";
}

/** 基準を切り替えた直後など、方向がまだ指定されていない時に使う既定の向き */
export function getDefaultDirection(criterion: SortCriterion): SortDirection {
  return SORT_OPTIONS.find((opt) => opt.value === criterion)?.defaultDirection ?? "asc";
}

function getExpansionOrderMap(): Map<string, number> {
  const map = new Map<string, number>();
  getAllExpansions().forEach((exp, index) => map.set(exp.id, index));
  return map;
}

function getCardNumber(card: Card): number {
  return Number(card.id.split("-")[1]) || 0;
}

export function sortCards(
  cards: Card[],
  criterion: SortCriterion,
  direction: SortDirection,
  lang: Lang = "ja"
): Card[] {
  const sorted = [...cards];
  const sign = direction === "asc" ? 1 : -1;

  switch (criterion) {
    case "name":
      sorted.sort((a, b) => {
        const nameA = getJapaneseName(a, lang) ?? a.name;
        const nameB = getJapaneseName(b, lang) ?? b.name;
        return sign * nameA.localeCompare(nameB, lang === "en" ? "en" : "ja");
      });
      break;

    case "hp":
      sorted.sort((a, b) => {
        if (a.health == null && b.health == null) return 0;
        if (a.health == null) return 1;
        if (b.health == null) return -1;
        return sign * (a.health - b.health);
      });
      break;

    case "rarity":
      sorted.sort(
        (a, b) =>
          sign *
          (getRaritySortIndex(a.rarity, a.shiny) - getRaritySortIndex(b.rarity, b.shiny))
      );
      break;

    case "newest":
      sorted.sort((a, b) => {
        if (!a.releaseDate && !b.releaseDate) return 0;
        if (!a.releaseDate) return 1;
        if (!b.releaseDate) return -1;
        return sign * a.releaseDate.localeCompare(b.releaseDate);
      });
      break;

    case "number":
    default: {
      const expansionOrder = getExpansionOrderMap();
      sorted.sort((a, b) => {
        const orderA = expansionOrder.get(a.setCode) ?? 999;
        const orderB = expansionOrder.get(b.setCode) ?? 999;
        if (orderA !== orderB) return sign * (orderA - orderB);
        return sign * (getCardNumber(a) - getCardNumber(b));
      });
      break;
    }
  }

  return sorted;
}
