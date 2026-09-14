import type { Card } from "@/types/card";
import { getAllCards, getCardById } from "@/lib/data";

/** alternate_versions(他バージョンの参照情報)から、実際のCardデータを引いてくる */
export function getAlternateVersionCards(card: Card): Card[] {
  return card.alternateVersions
    .map((alt) => getCardById(alt.id))
    .filter((c): c is Card => c != null);
}

export type RelatedCardRelation = "before" | "after" | "variant";

export interface RelatedCard {
  card: Card;
  relation: RelatedCardRelation;
}

/**
 * ポケモン名から、代表となる1枚を選ぶ(進化前後リンクの表示用)。
 * 同じシリーズに印刷がある場合はそちらを優先し、無ければ最初に見つかったものを使う
 * (レアリティ違いは、そのカード自身のページ側で改めて一覧できるためここでは絞らない)。
 */
function findRepresentativeCardByName(
  name: string,
  allCards: Card[],
  preferSetCode: string
): Card | undefined {
  const matches = allCards.filter((c) => c.name === name);
  return matches.find((c) => c.setCode === preferSetCode) ?? matches[0];
}

/**
 * カード詳細ページの「関連カード」に出す一覧。
 * ①進化前 ②進化後(分岐進化があれば複数) ③レアリティ・収録違いの3種類をまとめて返す。
 */
export function getRelatedCards(card: Card): RelatedCard[] {
  const allCards = getAllCards();
  const related: RelatedCard[] = [];

  if (card.evolvesFrom) {
    const before = findRepresentativeCardByName(card.evolvesFrom, allCards, card.setCode);
    if (before) related.push({ card: before, relation: "before" });
  }

  const afterNames = new Set(
    allCards.filter((c) => c.evolvesFrom === card.name).map((c) => c.name)
  );
  for (const name of afterNames) {
    const after = findRepresentativeCardByName(name, allCards, card.setCode);
    if (after) related.push({ card: after, relation: "after" });
  }

  for (const variant of getAlternateVersionCards(card)) {
    related.push({ card: variant, relation: "variant" });
  }

  return related;
}
