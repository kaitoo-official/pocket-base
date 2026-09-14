// Wishlist・マイコレクション・デッキ機能で使う、全カード分の最小限情報一覧。
// lib/trade.ts の getTradableCardOptions とほぼ同じ形だが、こちらはトレード不可カードも含む
// (Wishlist等はトレード条件に関係なく、どのカードでも対象にしたいため)。

import { getAllCards } from "@/lib/data";
import { getJapaneseName } from "@/lib/nameJa";
import { getCardImageUrl } from "@/lib/getCardImage";
import { getEffectiveType } from "@/lib/filterOptions";
import type { CardOption } from "@/lib/trade";
import type { Lang } from "@/lib/i18n/lang";

export function getAllCardOptions(lang: Lang = "ja"): CardOption[] {
  return getAllCards().map((card) => ({
    id: card.id,
    name: getJapaneseName(card, lang) ?? card.name,
    image: getCardImageUrl(card),
    type: getEffectiveType(card),
    rarity: card.rarity,
    shiny: card.shiny,
  }));
}
