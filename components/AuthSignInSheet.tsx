"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { AppleSignInLogo } from "@/components/AppleSignInLogo";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { getDict } from "@/lib/i18n/dict";

/**
 * 「Appleでサインイン」か「Googleでログイン」かを選ばせるボトムシート。
 * iOSアプリ版とWeb版で表示する(Androidアプリ版はAppleサインインを提供できないため
 * このシートを出さず、直接Googleログインを行う。呼び出し元はlib/auth/AuthProvider.tsx)。
 */
export function AuthSignInSheet({
  open,
  onChoose,
  onDismiss,
}: {
  open: boolean;
  onChoose: (provider: "apple" | "google") => void;
  onDismiss: () => void;
}) {
  const t = getDict(useLang()).auth;

  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onDismiss();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onDismiss]);

  if (!open) return null;

  return (
    <div className="theme-reset-light fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div
        className="absolute inset-0 bg-[#0B2D5B]/40"
        style={{ animation: "sheet-fade-in 0.15s ease-out" }}
        onClick={onDismiss}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={t.chooseTitle}
        className="relative flex w-full flex-col gap-3 rounded-t-2xl border border-line bg-surface p-5 shadow-xl sm:max-w-sm sm:rounded-2xl"
        style={{ animation: "sheet-slide-up 0.2s ease-out" }}
      >
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">{t.chooseTitle}</p>
          <button
            type="button"
            onClick={onDismiss}
            aria-label={t.cancel}
            className="cursor-pointer rounded-full p-1 text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Apple公式ロゴ(AppleSignInLogo)+文字を中央に並べた黒ボタン。ロゴの形/色は変えない */}
        <button
          type="button"
          onClick={() => onChoose("apple")}
          className="flex h-11 cursor-pointer items-center justify-center gap-2 rounded-full bg-black px-6 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          <AppleSignInLogo />
          {t.appleButton}
        </button>

        {/*
          Google公式ガイドライン(developers.google.com/identity/branding-guidelines)のライトテーマ:
          白地・1px #747775の枠・文字 #1F1F1F・公式の「G」ロゴ(Googleの配布素材 g-logo.png、色・比率は変えない)
        */}
        <button
          type="button"
          onClick={() => onChoose("google")}
          className="flex h-11 cursor-pointer items-center justify-center gap-2.5 rounded-full border border-[#747775] bg-white px-6 text-sm font-medium text-[#1F1F1F] transition-colors hover:bg-[#f3f3f3]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- 公式素材をそのまま表示するため */}
          <img src="/brand/google-g.png" alt="" width={20} height={20.4} className="h-5 w-auto" />
          {t.googleButton}
        </button>
      </div>
    </div>
  );
}
