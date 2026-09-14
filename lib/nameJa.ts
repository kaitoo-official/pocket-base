import pokemonNameJa from "@/lib/data/pokemon-name-ja.json";
import speciesNameJa from "@/lib/data/species-name-ja.json";
import seriesNameJa from "@/lib/data/series-name-ja.json";
import moveNameJa from "@/lib/data/move-name-ja.json";
import moveEffectJa from "@/lib/data/move-effect-ja.json";
import abilityNameJa from "@/lib/data/ability-name-ja.json";
import abilityEffectJa from "@/lib/data/ability-effect-ja.json";
import trainerNameJa from "@/lib/data/trainer-name-ja.json";
import type { Card } from "@/types/card";
import type { Lang } from "@/lib/i18n/lang";

const pokemonNameJaMap: Record<string, string> = pokemonNameJa;
const speciesNameJaMap: Record<string, string> = speciesNameJa;
const seriesNameJaMap: Record<string, string> = seriesNameJa;
const moveNameJaMap: Record<string, string> = moveNameJa;
const moveEffectJaMap: Record<string, string> = moveEffectJa;
const abilityNameJaMap: Record<string, string> = abilityNameJa;
const abilityEffectJaMap: Record<string, string> = abilityEffectJa;
const trainerNameJaMap: Record<string, string> = trainerNameJa;

/**
 * シリーズ(拡張パック)の日本語名を返す。Bulbapediaで確認した公式の日本語タイトルの対応表。
 * プロモ(pa/pb)は公式の固有タイトルが無いため、便宜的に「プロモカード(P-A)」のように表記する。
 * 対応表に無いsetCode(将来の新シリーズ等)の場合や英語表示時は、英語名をそのまま返す。
 */
export function getJapaneseSeriesName(setCode: string, fallbackName: string, lang: Lang = "ja"): string {
  if (lang === "en") return fallbackName;
  return seriesNameJaMap[setCode] ?? fallbackName;
}

/**
 * カードの日本語名を返す。
 * 対応表に無い場合(アローラのすがた等の一部の特殊フォルム)や、
 * 英語表示時はundefined。→ 呼び出し側はundefinedの時、英語名(card.name)をそのまま表示する。
 */
export function getJapaneseName(card: Pick<Card, "name" | "category">, lang: Lang = "ja"): string | undefined {
  if (lang === "en") return undefined;
  if (card.category !== "Pokémon") return trainerNameJaMap[card.name];
  return pokemonNameJaMap[card.name];
}

// プロモカードの pack フィールドに入る、配布経路を表す値の日本語名
const PACK_SOURCE_LABELS: Record<string, string> = {
  Shop: "ショップ",
  Campaign: "キャンペーン",
  Missions: "ミッション",
  "Premium Missions": "プレミアムミッション",
  "Wonder Pick": "ゲットチャレンジ",
};

/**
 * 収録パック名を日本語化する。
 * パック名の多くは"Charizard"のようなポケモン名(exが付かない)なので、
 * カード名用とは別に、種族名だけの対応表(speciesNameJa)を使う。
 * "Shared(拡張パック名)"の形式は、"Shared"の部分だけ日本語にする
 * (拡張パック名自体の正式な日本語訳はまだ対応表が無いため)。
 * "Shop""Wonder Pick"等のプロモ配布経路や、"Promo V1"のような配信プロモにも対応する。
 * 英語表示時は、元データがそもそも英語なのでそのまま返す。
 */
export function getJapanesePackName(pack: string, lang: Lang = "ja"): string {
  if (lang === "en") return pack;

  const sharedMatch = pack.match(/^Shared\((.+)\)$/);
  if (sharedMatch) {
    return `共通(${sharedMatch[1]})`;
  }

  if (PACK_SOURCE_LABELS[pack]) return PACK_SOURCE_LABELS[pack];

  const promoVMatch = pack.match(/^Promo V(\d+)$/);
  if (promoVMatch) return `配信プロモ(V${promoVMatch[1]})`;

  if (speciesNameJaMap[pack]) return speciesNameJaMap[pack];

  const megaMatch = pack.match(/^Mega (.+)$/);
  if (megaMatch && speciesNameJaMap[megaMatch[1]]) {
    return `メガ${speciesNameJaMap[megaMatch[1]]}`;
  }

  return pack;
}

/**
 * パックの表示名を返す。
 * パックが1種類しか無いシリーズは、データ上パック名が汎用的な"Booster"に
 * なっているだけなので、その場合はシリーズ名をそのまま表示する。
 */
export function getPackDisplayLabel(
  packName: string,
  setCode: string,
  seriesName: string,
  lang: Lang = "ja"
): string {
  if (packName === "Booster") return getJapaneseSeriesName(setCode, seriesName, lang);
  return getJapanesePackName(packName, lang);
}

/** 進化前ポケモンなど、素の種族名(ex・メガ等が付かない名前)を日本語化する。英語表示時はそのまま返す */
export function getJapaneseSpeciesName(name: string, lang: Lang = "ja"): string {
  if (lang === "en") return name;
  return speciesNameJaMap[name] ?? name;
}

/**
 * 技名を日本語化する。データはwikiwiki.jp/poke-pokeから収集したもので、
 * 未収録のセット(A3b以降)や対応表に無い技は英語名のままフォールバックする。
 */
export function getJapaneseMoveName(name: string, lang: Lang = "ja"): string {
  if (lang === "en") return name;
  return moveNameJaMap[name] ?? name;
}

/** 技の効果文を日本語化する。対応表に無い場合は英語の効果文をそのまま返す */
export function getJapaneseMoveEffect(effect: string, lang: Lang = "ja"): string {
  if (lang === "en") return effect;
  return moveEffectJaMap[effect] ?? effect;
}

/** 特性名を日本語化する。対応表に無い場合は英語名をそのまま返す */
export function getJapaneseAbilityName(name: string, lang: Lang = "ja"): string {
  if (lang === "en") return name;
  return abilityNameJaMap[name] ?? name;
}

/** 特性の効果文を日本語化する。対応表に無い場合は英語の効果文をそのまま返す */
export function getJapaneseAbilityEffect(effect: string, lang: Lang = "ja"): string {
  if (lang === "en") return effect;
  return abilityEffectJaMap[effect] ?? effect;
}
