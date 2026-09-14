"use client";

import { useEffect, useState, type ReactNode } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { getDict } from "@/lib/i18n/dict";

/**
 * 「絞り込み」ボタンを押すと、画面下からシート(パネル)がせり上がってくる部品。
 * 中身(children)は、page.tsx側が持つ1つの<form>の一部としてそのまま送信される
 * (このシート自体は見た目の開閉だけを担当し、フォームの入れ子は作らない)。
 */
export function FilterDrawer({
  activeCount,
  children,
}: {
  activeCount: number;
  children: ReactNode;
}) {
  const t = getDict(useLang()).filters;
  const [open, setOpen] = useState(false);

  // 開いている間は、背景のページがスクロールしないようにする
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  // Escapeキーでも閉じられるようにする
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 py-1.5 text-sm font-medium text-foreground shadow-sm transition-colors hover:border-accent/40 hover:bg-surface-hover"
      >
        <SlidersHorizontal className="h-4 w-4 text-accent" />
        <span>{t.openButton}</span>
        {activeCount > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-xs font-semibold text-background">
            {activeCount}
          </span>
        )}
      </button>

      {open && (
        <div className="theme-reset-light fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
          {/* 背景の半透明オーバーレイ。クリックすると閉じる */}
          <div
            className="absolute inset-0 bg-[#0B2D5B]/40"
            style={{ animation: "sheet-fade-in 0.15s ease-out" }}
            onClick={() => setOpen(false)}
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-label={t.openButton}
            className="relative flex max-h-[85vh] w-full flex-col rounded-t-2xl border border-line bg-surface shadow-xl sm:max-w-lg sm:rounded-2xl"
            style={{ animation: "sheet-slide-up 0.2s ease-out" }}
          >
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <p className="text-sm font-semibold text-foreground">
                {t.openButton}
                {activeCount > 0 ? `(${activeCount})` : ""}
              </p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t.close}
                className="cursor-pointer rounded-full p-1 text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4">{children}</div>
          </div>
        </div>
      )}
    </>
  );
}
