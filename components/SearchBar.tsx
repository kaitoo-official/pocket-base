import { Search } from "lucide-react";
import type { Lang } from "@/lib/i18n/lang";
import { getDict } from "@/lib/i18n/dict";

/**
 * カード検索の入力欄+ボタン。
 * フィルターと条件を同時に送信できるよう、外側の<form>はページ側(app/cards/page.tsx)が持つ。
 */
export function SearchBar({ defaultValue, lang = "ja" }: { defaultValue?: string; lang?: Lang }) {
  const t = getDict(lang);
  return (
    <div className="flex items-center gap-2 rounded-xl border border-line bg-surface p-2 shadow-xs transition-colors focus-within:border-accent/50">
      <Search className="ml-2 h-5 w-5 shrink-0 text-muted" />
      <input
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder={t.home.searchPlaceholder}
        className="h-11 w-full bg-transparent text-sm text-foreground placeholder:text-muted focus:outline-none"
      />
      <button
        type="submit"
        className="h-11 shrink-0 cursor-pointer rounded-lg bg-accent px-6 text-sm font-semibold text-white transition-colors hover:bg-accent-strong"
      >
        {lang === "en" ? "Search" : "検索"}
      </button>
    </div>
  );
}
