import { cookies } from "next/headers";
import { LANG_COOKIE_NAME, type Lang } from "@/lib/i18n/langTypes";

export type { Lang };
export { LANG_COOKIE_NAME };

/** 今のリクエストの表示言語をCookieから読み取る(サーバーコンポーネント専用)。未設定なら日本語 */
export async function getLang(): Promise<Lang> {
  const store = await cookies();
  return store.get(LANG_COOKIE_NAME)?.value === "en" ? "en" : "ja";
}
