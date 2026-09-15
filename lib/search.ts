import type { Card } from "@/types/card";
import {
  getJapaneseName,
  getJapaneseMoveName,
  getJapaneseMoveEffect,
  getJapaneseAbilityName,
  getJapaneseAbilityEffect,
} from "@/lib/nameJa";

/**
 * カード名(日本語名を含む)・技名・特性名・技/特性の効果文を対象に部分一致検索する。
 * 大文字・小文字は区別しない。
 * 技名・効果文・特性の日本語対応表(lib/data/move-name-ja.json等)は現時点で全件分は
 * 揃っていないため、対応表に無いものは英語名のみが検索対象になる(getJapaneseMoveName等は
 * 未対応の場合英語名をそのまま返すので、textsに重複が入るだけで検索結果は変わらない)。
 */
export function searchCards(cards: Card[], query: string): Card[] {
  const q = query.trim().toLowerCase();
  if (!q) return cards;

  return cards.filter((card) => {
    const texts: string[] = [card.name];

    const ja = getJapaneseName(card);
    if (ja) texts.push(ja);

    for (const attack of card.attacks) {
      texts.push(attack.name, getJapaneseMoveName(attack.name));
      if (attack.effect) texts.push(attack.effect, getJapaneseMoveEffect(attack.effect));
    }
    if (card.ability) {
      texts.push(card.ability.name, getJapaneseAbilityName(card.ability.name));
      if (card.ability.effect) texts.push(card.ability.effect, getJapaneseAbilityEffect(card.ability.effect));
    }

    return texts.some((text) => text.toLowerCase().includes(q));
  });
}
