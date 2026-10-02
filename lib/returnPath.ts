// カード詳細ページの「戻る」リンク行き先(呼び出し元のURL)を扱うためのユーティリティ。
// 一覧(/cards?...)やパック詳細(/packs/[packId])など、呼び出し元ごとに異なる
// 戻り先をcrawl可能な形で組み立て・検証する。

export type SearchParamsRecord = Record<string, string | string[] | undefined>;

/** 現在の検索条件(searchParams)を維持したクエリ文字列付きのパスを組み立てる */
export function buildReturnPath(basePath: string, searchParams: SearchParamsRecord): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (value == null) continue;
    if (Array.isArray(value)) {
      value.forEach((v) => params.append(key, v));
    } else {
      params.set(key, value);
    }
  }
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

// URLを実際に解決してみるためだけに使う、実在しないダミーのオリジン。
// このオリジンへアクセスすることはなく、「渡された値がこのオリジンのままのパスとして
// 解決できるか(=他のオリジンに化けないか)」を判定する目的だけに使う。
const SAFE_ORIGIN = "https://pocket-base.invalid";

/**
 * 「戻る」リンクの行き先として安全な、同一オリジンの相対パスかどうかを検証する。
 * 単純な前方一致チェックだけでは、ブラウザ側のURL解釈の揺れ(バックスラッシュが
 * スラッシュとして扱われる、制御文字が除去される等)によって外部サイトへの
 * オープンリダイレクトに悪用される余地が残るため、以下の多段チェックで防ぐ:
 *
 * 1. バックスラッシュ・空白・制御文字(タブ/改行等)を含む値を拒否する
 *    ("/\\evil.com"のような、ブラウザが"//evil.com"相当に解釈しうる形式への対策)
 * 2. "/"から始まらない値(スキーム付きURL"https://..."や"javascript:..."等)を拒否する
 * 3. "//"から始まる値(プロトコル相対URL)を拒否する
 * 4. 上記をすべて通過した値も、実在しないダミーオリジンに対して実際にURLとして
 *    解決してみて、オリジンが変わっていないか(＝本当に同一オリジンの相対パスか)を
 *    最終確認する(1〜3の文字列チェックだけでは見抜けない抜け道が万一あっても防ぐ)
 *
 * いずれかに該当する場合は、指定のデフォルトの戻り先にフォールバックする。
 */
export function sanitizeReturnPath(
  value: string | string[] | undefined,
  fallback: string
): string {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return fallback;

  if (/[\\\s\u0000-\u001F]/.test(raw)) return fallback;
  if (!raw.startsWith("/") || raw.startsWith("//")) return fallback;

  let resolved: URL;
  try {
    resolved = new URL(raw, SAFE_ORIGIN);
  } catch {
    return fallback;
  }
  if (resolved.origin !== SAFE_ORIGIN) return fallback;

  return raw;
}
