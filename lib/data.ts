// pokemon-tcg-pocket-cards パッケージの生データを読み込み、
// アプリで使いやすい形(types/card.ts の Card型)に変換するファイル。
//
// このファイルはサーバー側でのみ読み込まれ、変換済みのデータはメモリ上に
// 一度だけ作られる(モジュールが最初に読み込まれた時に下記の処理が1回だけ走る)。
// ブラウザに元の巨大なJSONがそのまま送られるわけではない。

import collectionData from "pokemon-tcg-pocket-cards/v5/collection";
import gameplayData from "pokemon-tcg-pocket-cards/v5/gameplay/no-image";
import expansionsData from "pokemon-tcg-pocket-cards/v5/expansions";
import type {
  AlternateVersion,
  Card,
  CardAbility,
  CardAttack,
  Expansion,
  Pack,
} from "@/types/card";

type GameplayEntry = (typeof gameplayData)[number];

/** "a1" + 227 のような分割された情報から、"a1-227" の完全なIDを作る */
function toFullId(setCode: string, cardNumber: number): string {
  return `${setCode}-${String(cardNumber).padStart(3, "0")}`;
}

/** gameplayの attacks オブジェクト({"1":..,"2":..}) を配列に変換し、空の技は除外する */
function buildAttacks(gameplay: GameplayEntry | undefined): CardAttack[] {
  if (!gameplay?.attacks) return [];
  const slots = [gameplay.attacks["1"], gameplay.attacks["2"]];
  return slots
    .filter((attack): attack is { name: string; cost: string; damage: number | null; effect: string | null } =>
      Boolean(attack && attack.name && attack.cost)
    )
    .map((attack) => ({
      name: attack.name,
      cost: attack.cost,
      damage: attack.damage,
      effect: attack.effect,
    }));
}

function buildAbility(gameplay: GameplayEntry | undefined): CardAbility | undefined {
  const ability = gameplay?.ability;
  if (!ability?.exists || !ability.name) return undefined;
  return { name: ability.name, effect: ability.effect };
}

function buildAlternateVersions(
  raw: { set_code: string; set_name: string; id: number; rarity: string }[] | undefined
): AlternateVersion[] {
  if (!raw) return [];
  return raw.map((alt) => ({
    id: toFullId(alt.set_code, alt.id),
    setCode: alt.set_code,
    setName: alt.set_name,
    rarity: alt.rarity,
  }));
}

/**
 * gameplay配列を、id をキーにした検索用の Map に変換する。
 * 絵違いカード(collectionにしか存在しない)は、自分の alternateVersions の中から
 * gameplayMapに存在するIDを1つ見つけて、そこから技・HPなどのデータを借りてくる。
 */
function resolveGameplay(
  cardId: string,
  alternateVersions: AlternateVersion[],
  gameplayMap: Map<string, GameplayEntry>
): GameplayEntry | undefined {
  const direct = gameplayMap.get(cardId);
  if (direct) return direct;

  for (const alt of alternateVersions) {
    const found = gameplayMap.get(alt.id);
    if (found) return found;
  }
  return undefined;
}

function buildCards(): Card[] {
  const gameplayMap = new Map<string, GameplayEntry>(
    gameplayData.map((entry) => [entry.id, entry])
  );

  return collectionData.map((entry) => {
    const alternateVersions = buildAlternateVersions(entry.alternate_versions);
    const gameplay = resolveGameplay(entry.id, alternateVersions, gameplayMap);

    const card: Card = {
      id: entry.id,
      name: entry.name,
      setCode: entry.set_code,
      setName: entry.set_name ?? entry.set_code,
      pack: entry.pack ?? "Shared",
      releaseDate: entry.release_date ?? null,

      category: (gameplay?.type as Card["category"]) ?? "Trainer",
      subtype: gameplay?.subtype ?? "",
      stage: gameplay?.stage,
      evolvesFrom: gameplay?.evolves_from,

      rarity: entry.rarity,
      artStyle: entry.art_style,
      artist: entry.artist,
      flavourText: entry.flavour_text,

      health: gameplay?.health,
      points: gameplay?.points,
      retreat: gameplay?.retreat,
      weakness: gameplay?.weakness && gameplay.weakness !== "none" ? gameplay.weakness : undefined,
      ability: buildAbility(gameplay),
      attacks: buildAttacks(gameplay),
      cardText: gameplay?.card_text,

      ex: entry.ex ?? false,
      mega: entry.mega ?? false,
      shiny: entry.shiny ?? false,
      specialTags: entry.special_tags ?? [],

      tradable: entry.tradable,
      sharable: entry.sharable,
      tradeCost: entry.trade_cost ?? null,
      packPoints: entry.pack_points,

      image: entry.image,
      imagePng: entry.image_png,

      alternateVersions,
    };

    return card;
  });
}

function buildExpansions(): Expansion[] {
  return expansionsData.map((exp) => ({
    id: exp.id,
    name: exp.name,
    releaseDate: exp.release_date,
    totalCards: exp.total_cards,
    packs: exp.packs.map((pack) => ({
      id: pack.id,
      name: pack.name,
      image: pack.image,
      imagePng: pack.image_png,
    })),
  }));
}

// モジュール読み込み時に一度だけ変換処理を実行し、結果をキャッシュしておく
const allCards: Card[] = buildCards();
const allExpansions: Expansion[] = buildExpansions();

export function getAllCards(): Card[] {
  return allCards;
}

export function getCardById(id: string): Card | undefined {
  return allCards.find((card) => card.id === id);
}

export function getAllExpansions(): Expansion[] {
  return allExpansions;
}

export function getExpansionById(id: string): Expansion | undefined {
  return allExpansions.find((exp) => exp.id === id);
}

export function getCardsBySetCode(setCode: string): Card[] {
  return allCards.filter((card) => card.setCode === setCode);
}

/** パックIDから、そのパックとその所属シリーズ情報を探す */
export function getPackById(packId: string): { pack: Pack; expansion: Expansion } | undefined {
  for (const expansion of allExpansions) {
    const pack = expansion.packs.find((p) => p.id === packId);
    if (pack) return { pack, expansion };
  }
  return undefined;
}

/**
 * 指定したパックから入手できるカード一覧を返す。
 * そのパック専用のカードに加えて、同じシリーズの「共通」カード(Shared)も、
 * 実際のゲームではどのパックからも出るため、合わせて含める。
 *
 * 注意: パックが1種類しか無いシリーズでは、パック名がデータ上"Booster"という
 * 汎用名になっている一方、カード側のpackフィールドには"Booster"ではなく
 * シリーズ名そのものが入っているというデータ特有のクセがある。そのため、
 * このパターンもカードの一致条件に含めている。
 */
export function getCardsForPack(expansion: Expansion, pack: Pack): Card[] {
  const sharedPackName = `Shared(${expansion.name})`;
  const isGenericBoosterPack = pack.name === "Booster";
  return allCards.filter((card) => {
    if (card.setCode !== expansion.id) return false;
    if (card.pack === pack.name || card.pack === sharedPackName) return true;
    if (isGenericBoosterPack && card.pack === expansion.name) return true;
    return false;
  });
}

/**
 * カード1枚から、それが収録されている「パック」を1つ特定する(getCardsForPackの逆引き)。
 * Shared(...)カードはそのシリーズのどのパックからも出るため、特定の1パックには絞れない
 * (undefinedを返す。呼び出し側はシリーズ名だけリンクにする等の対応をする)。
 */
export function getPackForCard(card: Card): { pack: Pack; expansion: Expansion } | undefined {
  const expansion = getExpansionById(card.setCode);
  if (!expansion) return undefined;
  if (card.pack.startsWith("Shared(")) return undefined;

  const direct = expansion.packs.find((p) => p.name === card.pack);
  if (direct) return { pack: direct, expansion };

  // パックが1種類しか無いシリーズは、カード側のpackにパック名ではなくシリーズ名がそのまま入っている
  const genericBooster = expansion.packs.find((p) => p.name === "Booster");
  if (genericBooster && card.pack === expansion.name) return { pack: genericBooster, expansion };

  return undefined;
}
