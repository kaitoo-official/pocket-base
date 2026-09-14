"use client";

import { useEffect, useRef, useState } from "react";
import { Download, ImageIcon, Share2, X } from "lucide-react";
import { generateTradeShareImage } from "@/lib/tradeShareImage";
import type { CardOption } from "@/lib/trade";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { getDict } from "@/lib/i18n/dict";

/**
 * トレード投稿フォームの「画像でシェア」ボタンから開く、プレビュー付きのモーダル。
 * 開いた瞬間の入力内容(カード構成・フレンドID・メモ)をそのまま画像にする
 * (このモーダル自体は投稿フォームの状態を編集しない、確認・書き出し専用の画面)。
 */
export function TradeShareImageModal({
  offerCards,
  wantCards,
  friendId,
  memo,
  onClose,
}: {
  offerCards: CardOption[];
  wantCards: CardOption[];
  friendId: string;
  memo: string;
  onClose: () => void;
}) {
  const lang = useLang();
  const t = getDict(lang).trade.shareImage;

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const blobRef = useRef<Blob | null>(null);

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

  useEffect(() => {
    let cancelled = false;
    generateTradeShareImage({ offerCards, wantCards, friendId, memo, lang })
      .then((blob) => {
        if (cancelled) return;
        blobRef.current = blob;
        setPreviewUrl(URL.createObjectURL(blob));
      })
      .catch(() => {
        if (!cancelled) setError(t.generateError);
      })
      .finally(() => {
        if (!cancelled) setGenerating(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function handleDownload() {
    if (!blobRef.current) return;
    const url = URL.createObjectURL(blobRef.current);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pocket-base-trade.png";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function handleShare() {
    if (!blobRef.current) return;
    const file = new File([blobRef.current], "pocket-base-trade.png", { type: "image/png" });

    // 対応環境(主にスマホのブラウザ)では、OS標準の共有シートを開いて
    // X・Instagram・LINEなど好きなアプリに画像ごと渡せるようにする。
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], text: t.shareText });
      } catch {
        // ユーザーによるキャンセルも含まれるため、ここでは何もしない
      }
      return;
    }

    // 非対応環境(主にPCブラウザ)では、Xの投稿画面を開くフォールバックにする
    const url = new URL("https://twitter.com/intent/tweet");
    url.searchParams.set("text", t.shareText);
    window.open(url.toString(), "_blank", "noopener,noreferrer");
  }

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
        aria-label={t.modalTitle}
        className="relative flex max-h-[90vh] w-full flex-col rounded-t-2xl border border-line bg-surface shadow-xl sm:max-w-lg sm:rounded-2xl"
        style={{ animation: "sheet-slide-up 0.2s ease-out" }}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-line px-4 py-3">
          <div>
            <h2 className="text-xl font-bold text-foreground">{t.modalTitle}</h2>
            <p className="mt-0.5 text-xs text-muted">{t.modalDescription}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.close}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4">
          <div className="relative w-full overflow-hidden rounded-xl border border-line bg-background shadow-sm">
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt={t.modalTitle} className="w-full" />
            ) : (
              <div className="flex aspect-[4/5] w-full flex-col items-center justify-center gap-2 text-muted">
                <ImageIcon className="h-10 w-10" />
              </div>
            )}
            {generating && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/60">
                <p className="text-sm font-medium text-foreground">{t.generating}</p>
              </div>
            )}
          </div>

          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleDownload}
              disabled={!previewUrl}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-teal-400 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-500/20 transition-opacity duration-150 hover:opacity-90 disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              {t.downloadButton}
            </button>
            <button
              type="button"
              onClick={handleShare}
              disabled={!previewUrl}
              className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-5 py-2.5 text-sm font-semibold text-foreground shadow-xs transition-colors duration-150 hover:border-accent/40 hover:bg-surface-hover disabled:opacity-50"
            >
              <Share2 className="h-4 w-4" />
              {t.shareButton}
            </button>
          </div>
          <p className="mt-2 text-xs text-muted">{t.shareHint}</p>
        </div>
      </div>
    </div>
  );
}
