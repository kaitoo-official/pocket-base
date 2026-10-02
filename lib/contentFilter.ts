// トレード投稿・コメント・ニックネームの投稿前チェック用、最低限のコンテンツフィルター。
//
// ここでの判定はあくまでクライアント側の一次防御(UX目的)。Firestoreルール側にも
// URLスパム等の分かりやすいパターンだけを最終防波堤として追加しているが、
// 日本語の禁止語リストそのものをルールの正規表現へ展開するのは保守性の観点で見送っている
// (詳細はdocs/operations/MODERATION.md参照)。語彙は今後の運用状況に応じて追加していく想定。

const BANNED_SUBSTRINGS = [
  // 暴言・侮辱(日本語)
  "死ね",
  "殺す",
  "きえろ",
  "消えろ",
  "ばか",
  "馬鹿",
  "あほ",
  "カス",
  "くず",
  "クズ",
  "ごみ",
  "ゴミ",
  "うざい",
  "ウザい",
  // 詐欺・不正取引の誘導によく使われるフレーズ
  "先に送って",
  "先に渡して",
  "代行します",
  "外部サイトで取引",
  "line交換",
  "LINE交換",
  "ライン交換",
  // 英語の暴言・差別語(代表的なもののみ、全面的な網羅はしない)
  "fuck",
  "shit",
  "bitch",
  "asshole",
  "scam you",
];

const URL_PATTERN = /https?:\/\/|www\./i;

function normalize(text: string): string {
  // 全角/半角の空白・記号を間引いた判定にして、簡単な分割回避(「ば か」等)をある程度防ぐ
  return text.toLowerCase().replace(/[\s　.,!?・-]/g, "");
}

/** 禁止語・URLなど、投稿前に弾くべき内容を含むかどうかを判定する */
export function containsBannedContent(text: string): boolean {
  if (!text) return false;
  if (URL_PATTERN.test(text)) return true;
  const normalized = normalize(text);
  return BANNED_SUBSTRINGS.some((word) => normalized.includes(normalize(word)));
}
