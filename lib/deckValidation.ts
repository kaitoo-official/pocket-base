// 本家アプリの「デッキ保存」時のバリデーションを再現する。
// 本家では条件を満たさなくても保存自体はできる(「使用できない状態」として保存される)ため、
// ここでの判定も保存を止めるためではなく、警告メッセージの表示に使う。

import type { CardOption } from "@/lib/trade";

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

export interface DeckValidationFlags {
  /** デッキ枚数を20枚ちょうどにする */
  exactSize: boolean;
  /** たねポケモンを1枚以上入れる */
  hasBasicPokemon: boolean;
  /** 持っているカードのみで編成する(未ログイン時はチェック対象外として常にtrue) */
  ownsAllCards: boolean;
  /** エネルギーを設定している */
  hasEnergySet: boolean;
}

/**
 * @param ownedQuantities ログイン中はマイコレクションの所持数。未ログインならnull(所持チェックをスキップ)
 */
export function validateDeck(
  cardIds: string[],
  energyTypes: string[],
  cardMap: Map<string, CardOption>,
  ownedQuantities: Record<string, number> | null
): DeckValidationFlags {
  return {
    exactSize: cardIds.length === DECK_SIZE,
    hasBasicPokemon: cardIds.some((id) => {
      const card = cardMap.get(id);
      return card?.category === "Pokémon" && card.stage === "Basic";
    }),
    ownsAllCards: ownedQuantities === null || cardIds.every((id) => (ownedQuantities[id] ?? 0) >= 1),
    hasEnergySet: energyTypes.length > 0,
  };
}

export function isDeckValid(flags: DeckValidationFlags): boolean {
  return flags.exactSize && flags.hasBasicPokemon && flags.ownsAllCards && flags.hasEnergySet;
}
