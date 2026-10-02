// Deck Card Browser専用の軽量カードDTOと、それ専用の検索・絞り込み・並び替え。
//
// フルのCard型(types/card.ts)は技・特性・効果文・絵違いバージョン情報などデッキ選択画面では
// 使わない情報まで多数持っており、これを約3,879件分そのままServer ComponentからClient
// Componentへ渡すと転送量が大きくなりすぎる(実測でgzip約485KBになった)。
// Deck Card Browserが実際に使う最小限のフィールドだけを持つDeckBrowserCardに変換してから渡す。

import { getAllCards, getAllExpansions, getCardsForPack } from "@/lib/data";
import { getJapaneseName } from "@/lib/nameJa";
import { getCardImageUrl } from "@/lib/getCardImage";
import { getEffectiveType, parseRarityFilterValue, getRaritySortIndex } from "@/lib/filterOptions";
import { getExpansionOrderMap } from "@/lib/sort";
import type { SortCriterion, SortDirection } from "@/lib/sort";
import type { Card } from "@/types/card";
import type { Lang } from "@/lib/i18n/lang";

export interface DeckBrowserCard {
  id: string;
  /** 元データのカード名(英語)。言語を問わず検索できるよう、表示名と別に持っておく */
  name: string;
  /** 実際に画面に表示する名前(lang設定に応じて日本語/英語) */
  displayName: string;
  image: string;
  type: string;
  rarity: string;
  shiny: boolean;
  category: Card["category"];
  stage?: string;
  setCode: string;
  /** このカードが実際に排出されるパックのID一覧。サーバー側で事前計算済み(クライアントでgetPackById等を都度呼ばなくてよい) */
  packIds: string[];
  releaseDate: string | null;
  health?: number;
}

/**
 * カードIDごとに、実際に排出されるパックのID一覧を事前計算する。
 * lib/data.tsのgetCardsForPack()(共通(Shared)カードの扱いも含め検証済みのロジック)を
 * そのまま再利用し、判定ロジックを重複実装しない。
 */
function buildPackIdsByCardId(): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const expansion of getAllExpansions()) {
    for (const pack of expansion.packs) {
      for (const card of getCardsForPack(expansion, pack)) {
        const list = map.get(card.id);
        if (list) {
          list.push(pack.id);
        } else {
          map.set(card.id, [pack.id]);
        }
      }
    }
  }
  return map;
}

// 言語ごとに1回だけ変換し、以降は使い回す(getAllCards()と同じ考え方)
const cache = new Map<Lang, DeckBrowserCard[]>();

export function getDeckBrowserCards(lang: Lang = "ja"): DeckBrowserCard[] {
  const cached = cache.get(lang);
  if (cached) return cached;

  const packIdsByCardId = buildPackIdsByCardId();
  const result = getAllCards().map((card) => ({
    id: card.id,
    name: card.name,
    displayName: getJapaneseName(card, lang) ?? card.name,
    image: getCardImageUrl(card),
    type: getEffectiveType(card),
    rarity: card.rarity,
    shiny: card.shiny,
    category: card.category,
    stage: card.stage,
    setCode: card.setCode,
    packIds: packIdsByCardId.get(card.id) ?? [],
    releaseDate: card.releaseDate,
    health: card.health,
  }));

  cache.set(lang, result);
  return result;
}

export interface DeckBrowserFilterState {
  types: string[];
  rarities: string[];
  stages: string[];
  series: string[];
  packs: string[];
}

/** カード名(英語・表示名の両方)だけを対象にした検索。技・特性・効果文は対象外(デッキ選択では不要) */
export function searchDeckBrowserCards(cards: DeckBrowserCard[], query: string): DeckBrowserCard[] {
  const q = query.trim().toLowerCase();
  if (!q) return cards;
  return cards.filter(
    (card) => card.name.toLowerCase().includes(q) || card.displayName.toLowerCase().includes(q)
  );
}

function matchesRarity(card: DeckBrowserCard, rarities: string[]): boolean {
  if (rarities.length === 0) return true;
  return rarities.some((value) => {
    const { rarity, shiny } = parseRarityFilterValue(value);
    if (card.rarity !== rarity) return false;
    return shiny ? card.shiny : true;
  });
}

/** タイプ・レアリティ・ステージ・シリーズ・パックのみを対象にした絞り込み(lib/filter.tsの縮小版) */
export function filterDeckBrowserCards(
  cards: DeckBrowserCard[],
  filters: DeckBrowserFilterState
): DeckBrowserCard[] {
  return cards.filter((card) => {
    if (filters.types.length && !filters.types.includes(card.type)) return false;
    if (!matchesRarity(card, filters.rarities)) return false;
    if (filters.stages.length && !(card.stage && filters.stages.includes(card.stage))) return false;
    if (filters.series.length && !filters.series.includes(card.setCode)) return false;
    if (filters.packs.length && !filters.packs.some((p) => card.packIds.includes(p))) return false;
    return true;
  });
}

function getCardNumber(id: string): number {
  return Number(id.split("-")[1]) || 0;
}

export function sortDeckBrowserCards(
  cards: DeckBrowserCard[],
  criterion: SortCriterion,
  direction: SortDirection,
  lang: Lang = "ja"
): DeckBrowserCard[] {
  const sorted = [...cards];
  const sign = direction === "asc" ? 1 : -1;

  switch (criterion) {
    case "name":
      sorted.sort((a, b) => sign * a.displayName.localeCompare(b.displayName, lang === "en" ? "en" : "ja"));
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
        (a, b) => sign * (getRaritySortIndex(a.rarity, a.shiny) - getRaritySortIndex(b.rarity, b.shiny))
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
        return sign * (getCardNumber(a.id) - getCardNumber(b.id));
      });
      break;
    }
  }

  return sorted;
}
