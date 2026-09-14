import type { Card } from "@/types/card";
import { getJapaneseName } from "@/lib/nameJa";

/**
 * カード名(日本語名を含む)・技名・特性名・技/特性の効果文を対象に部分一致検索する。
 * 大文字・小文字は区別しない。
 * 効果文は今のところ英語のみ(例: "heal" "poison")。日本語の効果文対応表が
 * 用意でき次第、日本語キーワード(例: "回復" "どく")での検索にも対応する予定。
 */
export function searchCards(cards: Card[], query: string): Card[] {
  const q = query.trim().toLowerCase();
  if (!q) return cards;

  return cards.filter((card) => {
    const texts: string[] = [card.name];

    const ja = getJapaneseName(card);
    if (ja) texts.push(ja);

    for (const attack of card.attacks) {
      texts.push(attack.name);
      if (attack.effect) texts.push(attack.effect);
    }
    if (card.ability) {
      texts.push(card.ability.name);
      if (card.ability.effect) texts.push(card.ability.effect);
    }

    return texts.some((text) => text.toLowerCase().includes(q));
  });
}
