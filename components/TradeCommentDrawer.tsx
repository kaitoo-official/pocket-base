"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { TradeComments } from "@/components/TradeComments";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { getDict } from "@/lib/i18n/dict";

/**
 * コメント欄を画面下からスライドインさせるドロワー(ボトムシート)。
 * FilterDrawerと同じ、既存のsheet-slide-up/sheet-fade-inアニメーションと
 * theme-reset-light(背景の明暗に関わらず読みやすいライト配色に固定)を使う。
 */
export function TradeCommentDrawer({
  postId,
  commentCount,
  onClose,
}: {
  postId: string;
  commentCount: number;
  onClose: () => void;
}) {
  const lang = useLang();
  const t = getDict(lang).trade.drawer;
  // 開いている間は、背景のページがスクロールしないようにする
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="theme-reset-light fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div
        className="absolute inset-0 bg-[#0B2D5B]/40"
        style={{ animation: "sheet-fade-in 0.15s ease-out" }}
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={t.ariaLabel}
        className="relative flex max-h-[85vh] w-full flex-col rounded-t-2xl border border-line bg-surface shadow-xl sm:max-w-lg sm:rounded-2xl"
        style={{ animation: "sheet-slide-up 0.2s ease-out" }}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-line px-4 py-3">
          <h2 className="text-base font-bold text-foreground">{t.title(commentCount.toLocaleString())}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.close}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4">
          <TradeComments postId={postId} />
        </div>
      </div>
    </div>
  );
}
