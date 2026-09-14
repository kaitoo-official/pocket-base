"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowDownWideNarrow, ArrowUpNarrowWide, ChevronDown } from "lucide-react";
import { getSortOptions, getDefaultDirection, type SortCriterion, type SortDirection } from "@/lib/sort";
import { useLang } from "@/lib/i18n/LanguageProvider";

/**
 * 並び替えの基準+昇順・降順を選べるプルダウン。
 * ネイティブの<select>はブラウザ・OSによって選択肢の余白を自由に調整できないため、
 * 自前のドロップダウン(CardPickerと同じ方式)で組んでいる。
 *
 * 絞り込みパネル(FilterDrawer)は閉じている間は中の<input>がDOMから消えるため、
 * 「今のフォームをそのまま送信する」方式だと、並び替えを変えた瞬間に
 * 絞り込み条件が消えてしまう不具合があった。それを避けるため、フォーム経由ではなく
 * 現在のURLの検索パラメータ(絞り込み条件を含む)をそのまま引き継いで、
 * sort/dirだけを書き換えたURLへ遷移する方式にしている。
 */
export function SortSelect({
  criterion,
  direction,
}: {
  criterion: SortCriterion;
  direction: SortDirection;
}) {
  const lang = useLang();
  const sortOptions = getSortOptions(lang);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  function navigateWithSort(nextCriterion: SortCriterion, nextDirection: SortDirection) {
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set("sort", nextCriterion);
    nextParams.set("dir", nextDirection);
    nextParams.delete("page"); // 並び替えを変えたら1ページ目に戻す
    router.push(`${pathname}?${nextParams.toString()}`);
  }

  // 基準を選ぶと、その基準にとって自然な向き(既定値)に変えて遷移する
  function selectCriterion(value: SortCriterion) {
    setIsOpen(false);
    navigateWithSort(value, getDefaultDirection(value));
  }

  function toggleDirection() {
    navigateWithSort(criterion, direction === "asc" ? "desc" : "asc");
  }

  const currentLabel = sortOptions.find((opt) => opt.value === criterion)?.label ?? "";

  return (
    <div className="inline-flex items-center gap-2">
      <div ref={containerRef} className="relative">
        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 py-1.5 text-sm font-medium text-foreground shadow-xs transition-colors hover:border-accent/40"
        >
          {currentLabel}
          <ChevronDown className={`h-4 w-4 text-muted transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>

        {isOpen && (
          <div className="theme-reset-light absolute right-0 z-20 mt-1.5 w-40 overflow-hidden rounded-xl border border-line bg-surface py-1 shadow-md">
            {sortOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => selectCriterion(opt.value)}
                className={`block w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-surface-hover ${
                  opt.value === criterion ? "font-semibold text-accent" : "text-foreground"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={toggleDirection}
        aria-label={
          lang === "en" ? (direction === "asc" ? "Ascending" : "Descending") : direction === "asc" ? "昇順" : "降順"
        }
        title={
          lang === "en" ? (direction === "asc" ? "Ascending" : "Descending") : direction === "asc" ? "昇順" : "降順"
        }
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
