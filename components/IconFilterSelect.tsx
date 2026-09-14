"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import type { Option } from "@/lib/filterOptions";

/**
 * タイプ/レアリティ絞り込み用の、アイコン付きドロップダウン。
 * ネイティブの<select><option>はアイコンなどのHTMLを中に入れられないため、
 * 「ボタン+自前のパネル」方式で組んでいる。
 */
export function IconFilterSelect({
  value,
  onChange,
  allLabel,
  options,
  renderIcon,
}: {
  value: string;
  onChange: (value: string) => void;
  allLabel: string;
  options: Option[];
  renderIcon: (value: string) => ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
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

  useEffect(() => {
    if (!isOpen) return;
    // パネルが画面下端をはみ出す時は、下ではなく上向きに開く
    // (はみ出したまま下スクロールしないと最後の選択肢が見えない/選べない、という状態を避ける)
    const rect = containerRef.current?.getBoundingClientRect();
    const estimatedPanelHeight = 260;
    setOpenUpward(!!rect && window.innerHeight - rect.bottom < estimatedPanelHeight);
  }, [isOpen]);

  const currentLabel = value ? options.find((opt) => opt.value === value)?.label ?? allLabel : allLabel;

  function select(next: string) {
    onChange(next);
    setIsOpen(false);
  }

  return (
    <div ref={containerRef} className="relative w-1/2">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="flex w-full items-center gap-1.5 rounded-lg border border-line bg-surface-hover px-2 py-1.5 text-xs text-foreground focus:border-accent/60 focus:outline-none"
      >
        {value && renderIcon(value)}
        <span className="truncate">{currentLabel}</span>
        <ChevronDown
          className={`ml-auto h-3.5 w-3.5 shrink-0 text-muted transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        // min-w-full+w-max: ボタン(w-1/2の狭い列)より選択肢の文字が長くても折り返させず、
        // パネル自体を必要な分だけ横に広げる(折り返すと行の高さがバラつき、一覧が見切れやすくなる)。
        // 上限(max-w)は設けない: 選択肢の文言はどれも短い日本語ラベルのみなので、
        // 無理に幅を制限して見切れさせるより必要な分だけ広がる方を優先する。
        // openUpwardは、画面下端をはみ出す位置で開いた時に上向きに開き直す処理
        // (下向きのまま画面外にはみ出すと、ページを別途スクロールしないと最後の選択肢が見えず、
        // 「ドロップダウンの中でスクロールできない」ように見えてしまうため)。
        // overflow-x-hiddenは必須: overflow-y-autoだけだとCSSの仕様上overflow-xも
        // 暗黙的にautoとして扱われ、使われない横スクロール用の余白が確保されて
        // 縦に使える高さがその分狭くなってしまう(=最後の選択肢に届かなくなる)ため、
        // 横方向は明示的に無効化しておく。
        // overscroll-containは、末端までスクロールした時に背面のページへスクロールが
        // 伝播してしまうのを防ぐ(openUpwardで画面内に収まるようになったことで安全に機能する)。
        <div
          className={`theme-reset-light absolute z-30 max-h-64 w-max min-w-full overflow-x-hidden overflow-y-auto overscroll-contain rounded-lg border border-line bg-surface py-1 shadow-lg ${
            openUpward ? "bottom-full mb-1" : "top-full mt-1"
          }`}
        >
          <button
            type="button"
            onClick={() => select("")}
            className={`block w-full px-3 py-1.5 text-left text-xs whitespace-nowrap transition-colors hover:bg-surface-hover ${
              value === "" ? "font-semibold text-accent" : "text-foreground"
            }`}
          >
            {allLabel}
          </button>
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => select(opt.value)}
              className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs whitespace-nowrap transition-colors hover:bg-surface-hover ${
                value === opt.value ? "font-semibold text-accent" : "text-foreground"
              }`}
            >
              {renderIcon(opt.value)}
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
