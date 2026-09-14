"use client";

import { useRouter } from "next/navigation";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { LANG_COOKIE_NAME, type Lang } from "@/lib/i18n/langTypes";

/**
 * JA/EN切り替えボタン。押すとCookieに保存してから画面を再描画する。
 * (router.refresh()はページ全体を再読み込みせず、サーバーコンポーネントだけを
 * 新しいCookieの値で再実行するので、体感が速い)
 */
export function LanguageToggle() {
  const lang = useLang();
  const router = useRouter();

  function setLang(next: Lang) {
    if (next === lang) return;
    document.cookie = `${LANG_COOKIE_NAME}=${next}; path=/; max-age=31536000`;
    router.refresh();
  }

  return (
    <div className="inline-flex items-center rounded-full border border-line bg-surface p-0.5 text-xs font-semibold">
      <button
        type="button"
        onClick={() => setLang("ja")}
        aria-pressed={lang === "ja"}
        className={`rounded-full px-2.5 py-1 transition-colors ${
          lang === "ja" ? "bg-accent text-white" : "text-muted hover:text-foreground"
        }`}
      >
        JA
      </button>
      <button
        type="button"
        onClick={() => setLang("en")}
        aria-pressed={lang === "en"}
        className={`rounded-full px-2.5 py-1 transition-colors ${
          lang === "en" ? "bg-accent text-white" : "text-muted hover:text-foreground"
        }`}
      >
        EN
      </button>
    </div>
  );
}
