import type { Card } from "@/types/card";
import { getPackById } from "@/lib/data";
import { getEffectiveType, parseRarityFilterValue } from "@/lib/filterOptions";

export interface FilterState {
  types: string[];
  rarities: string[];
  category?: string;
  stages: string[];
  series: string[];
  packs: string[];
  /** "pack"(通常のパック排出) または "promo"(プロモカード) */
  acquisition?: string;
  hpMin?: number;
  hpMax?: number;
  damageMin?: number;
  damageMax?: number;
  /** "has"(特性あり) または "none"(特性なし) */
  ability?: string;
  /** "ex" "mega" のうち選ばれたもの(複数可) */
  cardFlags: string[];
  /** にげるエネルギーの数(文字列化した数値。トレーナーズには無い項目) */
  retreatCosts: string[];
}

function toArray(value: string | string[] | undefined): string[] {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

/** URLの検索パラメータ(searchParams)から、フィルター条件を組み立てる */
export function parseFilterState(
  params: Record<string, string | string[] | undefined>
): FilterState {
  const toSingle = (value: string | string[] | undefined): string | undefined => {
    const v = Array.isArray(value) ? value[0] : value;
    return v ? v : undefined; // ラジオボタンの「すべて」は空文字で送られてくる
  };

  return {
    types: toArray(params.type),
    rarities: toArray(params.rarity),
    category: toSingle(params.category),
    stages: toArray(params.stage),
    series: toArray(params.series),
    packs: toArray(params.pack),
    acquisition: toSingle(params.acquisition),
    hpMin: params.hpMin ? Number(params.hpMin) : undefined,
    hpMax: params.hpMax ? Number(params.hpMax) : undefined,
    damageMin: params.damageMin ? Number(params.damageMin) : undefined,
    damageMax: params.damageMax ? Number(params.damageMax) : undefined,
    ability: toSingle(params.ability),
    cardFlags: toArray(params.cardFlag),
    retreatCosts: toArray(params.retreatCost),
  };
}

/**
 * 入手方法を判定する。
 * データ上は「プロモかどうか」しか確実に判別できないため、今は2種類に単純化している。
 * (プロモの中でのショップ/キャンペーン等の内訳は、カードの pack フィールドで別途確認できる)
 */
export function getAcquisitionMethod(card: Card): "pack" | "promo" {
  return card.rarity === "Promo" ? "promo" : "pack";
}

/**
 * カードが、指定したパックIDのどれかから入手できるかを判定する。
 * 実際のゲームでは、そのパック専用のカードだけでなく、
 * 同じシリーズの「共通」カードもどのパックからも出るため、それも含める。
 */
function cardMatchesAnyPack(card: Card, packIds: string[]): boolean {
  return packIds.some((packId) => {
    const found = getPackById(packId);
    if (!found) return false;
    const { pack, expansion } = found;
    if (card.setCode !== expansion.id) return false;
    if (card.pack === pack.name || card.pack === `Shared(${expansion.name})`) return true;
    // パックが1種類だけのシリーズは、カード側のpackがパック名"Booster"ではなく
    // シリーズ名そのものになっているデータ特有のクセがある(lib/data.tsのコメント参照)
    if (pack.name === "Booster" && card.pack === expansion.name) return true;
    return false;
  });
}

/** カードの技(複数あり得る)のうち、どれか1つでも指定したダメージ範囲に収まっていればOK */
function cardMatchesDamage(card: Card, min?: number, max?: number): boolean {
  if (min == null && max == null) return true;
  return card.attacks.some((attack) => {
    if (attack.damage == null) return false;
    if (min != null && attack.damage < min) return false;
    if (max != null && attack.damage > max) return false;
    return true;
  });
}

function cardMatchesFlags(card: Card, flags: string[]): boolean {
  if (flags.length === 0) return true;
  return flags.some((flag) => (flag === "mega" ? card.mega : flag === "ex" ? card.ex : false));
}

/**
 * カードがレアリティの絞り込み条件に合うか判定する。
 * 通常の値(例: "☆")は色違いかどうかを問わず一致とし、
 * 色違い専用の値(例: "☆-shiny")は実際に色違いのカードだけに一致させる。
 */
function cardMatchesRarity(card: Card, rarities: string[]): boolean {
  if (rarities.length === 0) return true;
  return rarities.some((value) => {
    const { rarity, shiny } = parseRarityFilterValue(value);
    if (card.rarity !== rarity) return false;
    return shiny ? card.shiny : true;
  });
}

export function filterCards(cards: Card[], filters: FilterState): Card[] {
  return cards.filter((card) => {
    if (filters.types.length && !filters.types.includes(getEffectiveType(card))) return false;
    if (!cardMatchesRarity(card, filters.rarities)) return false;
    if (filters.category && card.category !== filters.category) return false;
    if (filters.stages.length && !(card.stage && filters.stages.includes(card.stage))) {
      return false;
    }
    if (filters.series.length && !filters.series.includes(card.setCode)) return false;
    if (filters.packs.length && !cardMatchesAnyPack(card, filters.packs)) return false;
    if (filters.acquisition && getAcquisitionMethod(card) !== filters.acquisition) {
      return false;
    }
    if (filters.hpMin != null && (card.health == null || card.health < filters.hpMin)) {
      return false;
    }
    if (filters.hpMax != null && (card.health == null || card.health > filters.hpMax)) {
      return false;
    }
    if (!cardMatchesDamage(card, filters.damageMin, filters.damageMax)) return false;
    if (filters.ability === "has" && !card.ability) return false;
    if (filters.ability === "none" && card.ability) return false;
    if (!cardMatchesFlags(card, filters.cardFlags)) return false;
    if (
      filters.retreatCosts.length &&
      !(card.retreat != null && filters.retreatCosts.includes(String(card.retreat)))
    ) {
      return false;
    }
    return true;
  });
}

export function countActiveFilters(filters: FilterState): number {
  let count = 0;
  if (filters.types.length) count++;
  if (filters.rarities.length) count++;
  if (filters.category) count++;
  if (filters.stages.length) count++;
  if (filters.series.length) count++;
  if (filters.packs.length) count++;
  if (filters.acquisition) count++;
  if (filters.hpMin != null || filters.hpMax != null) count++;
  if (filters.damageMin != null || filters.damageMax != null) count++;
  if (filters.ability) count++;
  if (filters.cardFlags.length) count++;
  if (filters.retreatCosts.length) count++;
  return count;
}
