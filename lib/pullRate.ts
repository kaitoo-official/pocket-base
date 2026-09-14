// パックの排出確率から、特定のカードを引くまでに必要な平均パック数を計算する。
//
// 排出率の数値は公式のパック開封画面で開示されている確率をもとにしたもの
// (Game8「Card Rarity Guide」で書き写されている表。カード4・5枚目それぞれの
// 確率の合計がぴったり100%になっており、Dexerto等の別記事が引用する数字とも
// 一致することを確認済み)。
//
// 通常パック(5枚): 1〜3枚目は必ず◊1つ固定、4枚目・5枚目だけ下記の確率で変動する。
// レアパック(通称"ごパ", 出現確率0.05%): 出た場合は1★以上確定の別の確率テーブルになる。

import type { Card } from "@/types/card";
import { getExpansionById, getCardsForPack, getPackForCard } from "@/lib/data";
import { getAcquisitionMethod } from "@/lib/filter";

type RateKey = "◊" | "◊◊" | "◊◊◊" | "◊◊◊◊" | "☆" | "☆☆" | "☆☆☆" | "☆-shiny" | "☆☆-shiny" | "Crown Rare";

/** ☆・☆☆だけ色違い版が別レアリティ扱いで存在する(他のレアリティに色違いは無い) */
function getRateKey(rarity: string, shiny: boolean): RateKey | null {
  if (shiny) {
    if (rarity === "☆") return "☆-shiny";
    if (rarity === "☆☆") return "☆☆-shiny";
    return null;
  }
  if (rarity === "◊" || rarity === "◊◊" || rarity === "◊◊◊" || rarity === "◊◊◊◊") return rarity;
  if (rarity === "☆" || rarity === "☆☆" || rarity === "☆☆☆") return rarity;
  if (rarity === "Crown Rare") return "Crown Rare";
  return null; // プロモ等、パックから出ないレアリティ
}

// 通常パックの、カード4枚目・5枚目それぞれの排出確率
const STANDARD_PACK_RATES: Record<RateKey, { card4: number; card5: number }> = {
  "◊": { card4: 0, card5: 0 }, // 1〜3枚目で確定のため、4・5枚目はここでは0扱い
  "◊◊": { card4: 0.89, card5: 0.56 },
  "◊◊◊": { card4: 0.04952, card5: 0.1981 },
  "◊◊◊◊": { card4: 0.01666, card5: 0.06664 },
  "☆": { card4: 0.02572, card5: 0.10288 },
  "☆☆": { card4: 0.005, card5: 0.02 },
  "☆☆☆": { card4: 0.00222, card5: 0.00888 },
  "☆-shiny": { card4: 0.00714, card5: 0.02857 },
  "☆☆-shiny": { card4: 0.00333, card5: 0.01333 },
  "Crown Rare": { card4: 0.0004, card5: 0.0016 },
};
// 1〜3枚目は必ず◊のカードが出る(◊のカードだけ、この分の期待値も加算する)
const GUARANTEED_COMMON_SLOTS = 3;

// レアパックの出現確率と、出た場合の5枚それぞれの排出確率(5枚とも同じ確率分布)
const GOD_PACK_CHANCE = 0.0005;
const GOD_PACK_RATES: Partial<Record<RateKey, number>> = {
  "☆": 0.28571,
  "☆☆": 0.33333,
  "☆☆☆": 0.0238,
  "☆-shiny": 0.23809,
  "☆☆-shiny": 0.09523,
  "Crown Rare": 0.0238,
};

/** そのレアリティのカード1枚あたり、1パックで引ける期待枚数(プール内の同レアリティ枚数で割った値) */
function getExpectedCopiesPerPack(rateKey: RateKey, poolSize: number): number {
  if (poolSize <= 0) return 0;
  const std = STANDARD_PACK_RATES[rateKey];
  const guaranteedSlots = rateKey === "◊" ? GUARANTEED_COMMON_SLOTS : 0;
  const stdExpected = (guaranteedSlots + std.card4 + std.card5) / poolSize;
  const godRate = GOD_PACK_RATES[rateKey] ?? 0;
  const godExpected = (5 * godRate) / poolSize;
  return (1 - GOD_PACK_CHANCE) * stdExpected + GOD_PACK_CHANCE * godExpected;
}

export interface PullRateEstimate {
  packId: string;
  packName: string;
  poolSize: number;
  /** 1パックあたりこのカードを引ける期待枚数(≒確率。レアカードでは十分に小さい値になる) */
  probabilityPerPack: number;
  /** 平均して何パックでこのカードが1枚手に入るか */
  averagePacksNeeded: number;
  /** 90%の確率でこのカードが手に入るまでに必要なパック数 */
  packsFor90Percent: number;
}

/**
 * カード1枚について、パックごとの入手目安を計算する。
 * 対象パック(パック限定枠+共通枠)の中で同じレアリティのカードが何種類あるかを数え、
 * 排出確率と組み合わせて算出する。プロモカードなど、パックから出ないカードは空配列を返す。
 * 複数のパックから出せるカード(共通枠のカード)は、パックごとにそれぞれ算出して返す。
 */
export function getPullRateEstimates(card: Card): PullRateEstimate[] {
  if (getAcquisitionMethod(card) !== "pack") return [];

  const rateKey = getRateKey(card.rarity, card.shiny);
  if (!rateKey) return [];

  const expansion = getExpansionById(card.setCode);
  if (!expansion) return [];

  const direct = getPackForCard(card);
  const packs = direct ? [direct.pack] : expansion.packs;

  const estimates: PullRateEstimate[] = [];
  for (const pack of packs) {
    const pool = getCardsForPack(expansion, pack);
    const poolSize = pool.filter((c) => c.rarity === card.rarity && c.shiny === card.shiny).length;
    if (poolSize === 0) continue;

    const probabilityPerPack = getExpectedCopiesPerPack(rateKey, poolSize);
    if (probabilityPerPack <= 0) continue;

    estimates.push({
      packId: pack.id,
      packName: pack.name,
      poolSize,
      probabilityPerPack,
      averagePacksNeeded: 1 / probabilityPerPack,
      packsFor90Percent: Math.ceil(Math.log(1 - 0.9) / Math.log(1 - probabilityPerPack)),
    });
  }
  return estimates;
}
