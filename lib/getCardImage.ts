import type { Card, Pack } from "@/types/card";

/**
 * 画像が見つからない時に表示する代わりの画像。
 * 実体は public/images/no-image.svg
 */
export const FALLBACK_CARD_IMAGE = "/images/no-image.svg";

/**
 * カードの画像URLを取得する。
 * コンポーネント側で `card.image` と直接書かないようにするための窓口。
 * 将来、画像の取得元(CDNなど)を変更したくなった場合はこの関数だけ直せばよい。
 */
export function getCardImageUrl(card: Pick<Card, "image">): string {
  return card.image || FALLBACK_CARD_IMAGE;
}

export function getPackImageUrl(pack: Pick<Pack, "image">): string {
  return pack.image || FALLBACK_CARD_IMAGE;
}
