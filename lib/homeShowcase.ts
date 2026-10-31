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
        id: "sig-mega-mewtwo-x-tournament",
        youtubeId: "kJjsZxfv95g",
        titleJa:
          "【ポケポケ】”作成者が大会準優勝してデッキの強さ証明してきた”大会映像でメガミュウツーXデッキ紹介します　Pokémon Trading Card Game Pocket",
        titleEn:
          "[Pokémon TCG Pocket] \"The creator placed runner-up in a tournament, proving the deck's strength\" Introducing a Mega Mewtwo X deck with tournament footage",
        publishedAt: "2026-10-31T09:00:37+00:00",
      },
      {
        id: "sig-origin-giratina",
        youtubeId: "ceVWQyFjrTU",
        titleJa:
          "【ポケポケ】”新環境最強Tierかもしれません。”世界1位が組んだオリジンギラティナデッキ紹介します　Pokémon Trading Card Game Pocket",
        titleEn:
          "[Pokémon TCG Pocket] \"This might be the strongest tier in the new environment\" Introducing an Origin Forme Giratina deck built by the world #1 player",
        publishedAt: "2026-10-31T03:00:24+00:00",
      },
      {
        id: "sig-mega-dragonite",
        youtubeId: "VTpVNTwNm3I",
        titleJa:
          "【ポケポケ】” 過去最強のカイリューデッキ”メガシンカに落ちれば即勝ち。それ以外でも2発撃って勝ち。メガカイリューデッキを紹介します　Pokémon Trading Card Game Pocket",
        titleEn:
          "[Pokémon TCG Pocket] \"The strongest Dragonite deck ever\" An instant win if you reach Mega Evolution, and a win with two attacks even if you don't — introducing a Mega Dragonite deck",
        publishedAt: "2026-10-30T09:01:27+00:00",
      },
    ],
  },
];
