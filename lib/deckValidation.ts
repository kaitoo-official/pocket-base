// 本家アプリの「デッキ保存」時のバリデーションを再現する。
// 本家では条件を満たさなくても保存自体はできる(「使用できない状態」として保存される)ため、
// ここでの判定も保存を止めるためではなく、警告メッセージの表示に使う。
//
// 所持カード制限について: Pocket Baseのマイデッキは「今持っているカードだけで組む機能」ではなく、
// 「理想のデッキを自由に作成・保存できるデッキビルダー」として使えるようにするため、
// 未所持カードが含まれていることはisDeckValid()の判定(=ゲームルール上使えるデッキかどうか)には
// 含めない。所持状況はgetDeckOwnershipInfo()で別途取得できる、あくまで補助的な情報として扱う。

import type { Card } from "@/types/card";

export const DECK_SIZE = 20;

/** デッキに設定できるエネルギータイプ(本家と同じ8種類。ドラゴン・無色は対象外) */
export const DECK_ENERGY_TYPES = [
  "Grass",
  "Fire",
  "Water",
  "Lightning",
  "Psychic",
  "Fighting",
  "Darkness",
  "Metal",
];

/** validateDeckが実際に必要とする最小限のカード情報 */
export type DeckValidationCard = Pick<Card, "category" | "stage">;

export interface DeckValidationFlags {
  /** デッキ枚数を20枚ちょうどにする */
  exactSize: boolean;
  /** たねポケモンを1枚以上入れる */
  hasBasicPokemon: boolean;
  /** エネルギーを設定している */
  hasEnergySet: boolean;
}

/**
 * デッキがゲームルール上「使用可能」かどうかを判定する(所持状況は含まない)。
 */
export function validateDeck(
  cardIds: string[],
  energyTypes: string[],
  cardMap: Map<string, DeckValidationCard>
): DeckValidationFlags {
  return {
    exactSize: cardIds.length === DECK_SIZE,
    hasBasicPokemon: cardIds.some((id) => {
      const card = cardMap.get(id);
      return card?.category === "Pokémon" && card.stage === "Basic";
    }),
    hasEnergySet: energyTypes.length > 0,
  };
}

export function isDeckValid(flags: DeckValidationFlags): boolean {
  return flags.exactSize && flags.hasBasicPokemon && flags.hasEnergySet;
}

/** デッキ内で、指定したカードが何枚入っているか(0〜) */
export function countCardInDeck(cardIds: string[], id: string): number {
  return cardIds.filter((v) => v === id).length;
}

/** デッキにカードを1枚追加する。全体の上限(max)・同一カードの上限(maxPerCard)に達している場合は何もしない */
export function addCardToDeck(cardIds: string[], id: string, max: number, maxPerCard: number): string[] {
  if (cardIds.length >= max) return cardIds;
  if (countCardInDeck(cardIds, id) >= maxPerCard) return cardIds;
  return [...cardIds, id];
}

/** デッキから指定したカードを1枚だけ減らす(同じカードが複数あっても1枚だけ外す) */
export function removeCardFromDeck(cardIds: string[], id: string): string[] {
  const index = cardIds.lastIndexOf(id);
  if (index === -1) return cardIds;
  return cardIds.filter((_, i) => i !== index);
}

export interface DeckOwnershipInfo {
  /** デッキに含まれる枚数のうち、実際に所持している枚数 */
  ownedCount: number;
  /** 未所持の枚数(同じカードを2枚使っていて1枚しか持っていない場合は1とカウントする) */
  missingCount: number;
}

/**
 * デッキの所持状況を集計する、補助情報専用の関数(isDeckValid等の判定には使わない)。
 * @param ownedQuantities ログイン中はマイコレクションの所持数。未ログインならnull
 */
export function getDeckOwnershipInfo(
  cardIds: string[],
  ownedQuantities: Record<string, number> | null
): DeckOwnershipInfo | null {
  if (ownedQuantities === null) return null;

  // 同じカードを2枚使っている場合、所持2枚なら両方所持扱い、所持1枚なら片方だけ所持扱いにする
  const usedSoFar: Record<string, number> = {};
  let ownedCount = 0;
  for (const id of cardIds) {
    const used = (usedSoFar[id] ?? 0) + 1;
    usedSoFar[id] = used;
    if (used <= (ownedQuantities[id] ?? 0)) ownedCount += 1;
  }
  return { ownedCount, missingCount: cardIds.length - ownedCount };
}
