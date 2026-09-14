"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { getDict } from "@/lib/i18n/dict";

export type TradeSortOrder = "new" | "old" | "comments";

/** 投稿一覧の並び替えプルダウン。カード一覧のSortSelectと同じ、ピル型ボタン+自前パネルの見た目に揃えている */
export function TradePostSortSelect({
  value,
  onChange,
}: {
  value: TradeSortOrder;
  onChange: (value: TradeSortOrder) => void;
}) {
  const lang = useLang();
  const t = getDict(lang).trade.sort;
  const SORT_OPTIONS: { value: TradeSortOrder; label: string }[] = [
    { value: "new", label: t.new },
    { value: "old", label: t.old },
    { value: "comments", label: t.comments },
  ];
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  const currentLabel = SORT_OPTIONS.find((opt) => opt.value === value)?.label ?? "";

  return (
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
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className={`block w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-surface-hover ${
                opt.value === value ? "font-semibold text-accent" : "text-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
