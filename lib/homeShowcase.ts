// ホーム画面の「注目カード」「インフルエンサー動画」に表示する内容。
//
// 使用率・再生数などの実データを取得できる外部ソースが無いため、
// この配列を手動で編集して差し替える方式にしている(CLAUDE.mdの
// 「外部データに存在しない項目を推測で作らない」を踏まえ、統計値を装う
// 表示はせず、あくまで運営が選んだ紹介という位置づけにする)。

export interface FeaturedCardEntry {
  /** types/card.ts の Card.id (例: "a1-001") */
  cardId: string;
  commentJa: string;
  commentEn: string;
}

// gamewith「ポケポケ 最強デッキ・カードランキング」のSSランク(Tier1)カード一覧を元にした選出
// (https://gamewith.jp/pokemon-tcg-pocket/470479 で確認)。同名カードが複数の収録違いを持つ場合は、
// 色違い(shiny)を除いた中で一番レアリティが高い収録違い(◊<☆<☆☆<☆☆☆<クラウンの順)を選んでいる。
export const FEATURED_CARDS: FeaturedCardEntry[] = [
  { cardId: "b3-204", commentJa: "SSランク(最強クラス)", commentEn: "SS Rank (Top Tier)" },
  { cardId: "b1-280", commentJa: "SSランク(最強クラス)", commentEn: "SS Rank (Top Tier)" },
  { cardId: "a4a-090", commentJa: "SSランク(最強クラス)", commentEn: "SS Rank (Top Tier)" },
  { cardId: "b4-199", commentJa: "SSランク(最強クラス)", commentEn: "SS Rank (Top Tier)" },
  { cardId: "b4-194", commentJa: "SSランク(最強クラス)", commentEn: "SS Rank (Top Tier)" },
  { cardId: "b1-275", commentJa: "SSランク(最強クラス)", commentEn: "SS Rank (Top Tier)" },
  { cardId: "b1-245", commentJa: "SSランク(最強クラス)", commentEn: "SS Rank (Top Tier)" },
  { cardId: "a3-165", commentJa: "SSランク(最強クラス)", commentEn: "SS Rank (Top Tier)" },
  { cardId: "a4b-373", commentJa: "SSランク(最強クラス)", commentEn: "SS Rank (Top Tier)" },
  { cardId: "a2b-111", commentJa: "SSランク(最強クラス)", commentEn: "SS Rank (Top Tier)" },
  { cardId: "a2-190", commentJa: "SSランク(最強クラス)", commentEn: "SS Rank (Top Tier)" },
  { cardId: "a4b-379", commentJa: "SSランク(最強クラス)", commentEn: "SS Rank (Top Tier)" },
];

export interface InfluencerVideoEntry {
  /** React key用。並び替えても衝突しないよう自由な文字列でよい */
  id: string;
  /** YouTube動画URLの "v=" の後ろの部分 */
  youtubeId: string;
  titleJa: string;
  titleEn: string;
  /** YouTube側の投稿日(ISO形式)。新着順に並べ替えるためのソートキーとして使う */
  publishedAt: string;
}

export interface InfluencerChannelEntry {
  /** React key用 */
  id: string;
  channelName: string;
  /** チャンネルトップページのURL */
  channelUrl: string;
  /** チャンネルアイコン画像のURL(YouTube側から直接取得。自サーバーには保存しない) */
  avatarUrl: string;
  videos: InfluencerVideoEntry[];
}

export const INFLUENCER_CHANNELS: InfluencerChannelEntry[] = [
  {
    id: "sig",
    channelName: "シグ",
    channelUrl: "https://youtube.com/@_s1gun",
    avatarUrl:
      "https://yt3.googleusercontent.com/xvZbdOIEBT-jIbfl24otS79RkwIF0PVB1LXR2WSgr1Z9RWz_32PixalKJ30ITsJtpHE0QmBRiQ=s160-c-k-c0x00ffffff-no-rj",
    videos: [
      {
        id: "sig-butterfree-jukain",
        youtubeId: "MUNbAFPyaVY",
        titleJa:
          "『ポケポケ』超高勝率を出している誰でも使える超簡単最強デッキ 大会予選全勝したバタフリージュカインを解説&紹介します",
        titleEn:
          "[Pokémon TCG Pocket] An easy, top-tier deck with an insanely high win rate — undefeated in tournament qualifiers with Butterfree & Sceptile",
        publishedAt: "2026-09-03T03:00:34-07:00",
      },
      {
        id: "sig-mega-charizard",
        youtubeId: "MXbbtN2xpkM",
        titleJa:
          "【ロケット団の野望】\"爆速マスター到達\"勝率83%で無双した1ターンキル多数最強メガリザードンデッキを紹介します　Pokémon Trading Card Game Pocket",
        titleEn:
          "[Team Rocket's Ambition] Reached Master rank in record time with an 83% win rate — the strongest Mega Charizard deck with tons of one-turn kills",
        publishedAt: "2026-09-15T01:11:07-07:00",
      },
      {
        id: "sig-tier1-decks",
        youtubeId: "dpM87nJrJEY",
        titleJa:
          "【ポケポケ】\"Tier1確定。この動画の最強デッキを作るだけで良い\"新環境でも生き残りTier1が確定しているデッキを4個紹介します　Pokémon Trading Card Game Pocket",
        titleEn:
          "[Pokémon TCG Pocket] \"Tier 1 confirmed — just build the deck in this video\" Introducing 4 decks confirmed Tier 1 even in the new environment",
        publishedAt: "2026-09-02T05:05:58-07:00",
      },
    ],
  },
];
