"use client";

import { useRef } from "react";
import { ArrowDownWideNarrow, ArrowUpNarrowWide } from "lucide-react";
import { useLang } from "@/lib/i18n/LanguageProvider";

export type PackSortDirection = "asc" | "desc";

/**
 * パック一覧の並び替え。基準は「リリース順」の1つだけなので、SortSelectと違って
 * 基準を選ぶドロップダウンは持たない。ラベルはボタンと誤解されないよう、
 * 枠や背景の無いただの説明テキストとして表示し、実際に押せるのは丸い矢印ボタンだけにしている。
 * カード一覧のSortSelectと同じ、hidden inputでフォームを自動送信する方式。
 */
export function PackSortSelect({ direction }: { direction: PackSortDirection }) {
  const lang = useLang();
  const dirInputRef = useRef<HTMLInputElement>(null);
  const ascLabel = lang === "en" ? "Ascending" : "昇順";
  const descLabel = lang === "en" ? "Descending" : "降順";

  function toggleDirection() {
    if (dirInputRef.current) {
      dirInputRef.current.value = direction === "asc" ? "desc" : "asc";
    }
    dirInputRef.current?.form?.requestSubmit();
  }

  return (
    <div className="inline-flex items-center gap-2">
      <input ref={dirInputRef} type="hidden" name="dir" defaultValue={direction} />
      <span className="text-sm text-muted">{lang === "en" ? "Release order" : "リリース順"}</span>
      <button
        type="button"
        onClick={toggleDirection}
        aria-label={direction === "asc" ? ascLabel : descLabel}
        title={direction === "asc" ? ascLabel : descLabel}
        className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-line bg-accent text-white shadow-xs transition-colors hover:bg-accent-strong"
      >
        {direction === "asc" ? (
          <ArrowUpNarrowWide className="h-4 w-4" />
        ) : (
          <ArrowDownWideNarrow className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}
