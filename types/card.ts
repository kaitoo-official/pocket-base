// アプリ内で共通して使う「カード1枚分のデータ」の設計図(型)。
// pokemon-tcg-pocket-cardsパッケージの生データ(collection + gameplay)を
// lib/data.ts で1つにまとめた形が、この Card 型になる。

export type CardCategory = "Pokémon" | "Trainer";

export interface CardAttack {
  name: string;
  /** 必要エネルギーの記号をつなげた文字列。例: "GGC" */
  cost: string;
  damage: number | null;
  effect: string | null;
}

export interface CardAbility {
  name: string;
  effect: string | null;
}

/** 同じカードの、別シリーズ・別レアリティのバージョン情報 */
export interface AlternateVersion {
  /** 完全なカードID。例: "a3-210" */
  id: string;
  setCode: string;
  setName: string;
  rarity: string;
}

export interface Card {
  /** 完全なカードID。例: "a1-001" */
  id: string;
  name: string;
  setCode: string;
  setName: string;
  /** 収録パック名。共通枠の場合は "Shared(拡張パック名)" の形式 */
  pack: string;
  releaseDate: string | null;

  category: CardCategory;
  /** ポケモン: エネルギータイプ / トレーナーズ: Item・Supporter・Tool・Stadium */
  subtype: string;
  /** Basic / Stage 1 / Stage 2。トレーナーズカードでは存在しない */
  stage?: string;
  /** 進化前のポケモン名。Stage 1・2のみ存在 */
  evolvesFrom?: string;

  /** ◊ ◊◊ ◊◊◊ ◊◊◊◊ ☆ ☆☆ ☆☆☆ Crown Rare Promo のいずれか */
  rarity: string;
  /** "Full Art" "Shiny" などの絵柄の種類。無い場合は存在しない */
  artStyle?: string;
  artist?: string;
  flavourText?: string;

  health?: number;
  points?: number;
  retreat?: number;
  /** 弱点タイプ。弱点が無い場合は存在しない */
  weakness?: string;
  ability?: CardAbility;
  /** 技の一覧。技が無いトレーナーズカードでは空配列 */
  attacks: CardAttack[];
  /** トレーナーズカードのルールテキスト */
  cardText?: string;

  ex: boolean;
  mega: boolean;
  shiny: boolean;
  specialTags: string[];

  tradable: boolean;
  sharable: boolean;
  tradeCost: number | null;
  /** クラフトに必要なポイント数。プロモは存在しない */
  packPoints?: number;

  /** 画像URL。データに無い場合は undefined(表示側でfallback画像を使う) */
  image?: string;
  imagePng?: string;

  /** このカードの、他バージョン(絵違い・レアリティ違い)一覧 */
  alternateVersions: AlternateVersion[];
}

export interface Pack {
  id: string;
  name: string;
  image: string | null;
  imagePng: string | null;
}

export interface Expansion {
  id: string;
  name: string;
  releaseDate: string | null;
  totalCards: number;
  packs: Pack[];
}
