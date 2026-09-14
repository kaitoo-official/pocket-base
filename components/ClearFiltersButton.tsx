"use client";

import { useLang } from "@/lib/i18n/LanguageProvider";
import { getDict } from "@/lib/i18n/dict";

/**
 * 「条件をクリア」ボタン。
 * ページ遷移はせず、同じフォーム内のチェックボックス・ラジオボタン・数値欄だけを
 * その場で未選択に戻す(検索キーワードの欄には触れない)。
 * 実際に一覧に反映するには、この後「絞り込む」を押す必要がある。
 */
export function ClearFiltersButton() {
  const t = getDict(useLang()).filters;
  return (
    <button
      type="button"
      onClick={(event) => {
        const form = event.currentTarget.closest("form");
        if (!form) return;

        form.querySelectorAll<HTMLInputElement>('input[type="checkbox"]').forEach((el) => {
          el.checked = false;
        });
        form.querySelectorAll<HTMLInputElement>('input[type="radio"]').forEach((el) => {
          el.checked = el.value === ""; // "すべて" を選び直した状態に戻す
        });
        form.querySelectorAll<HTMLInputElement>('input[type="number"]').forEach((el) => {
          el.value = "";
        });
      }}
      className="cursor-pointer rounded-lg border border-line px-4 py-2 text-sm text-muted transition-colors hover:bg-surface-hover"
    >
      {t.clear}
    </button>
  );
}
