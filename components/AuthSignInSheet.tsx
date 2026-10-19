"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { AppleSignInLogo } from "@/components/AppleSignInLogo";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { getDict } from "@/lib/i18n/dict";

/**
 * 「Appleでサインイン」か「Googleでログイン」かを選ばせるボトムシート。
 * ガイドライン1.2(UGC)対応として、ログイン(=登録)の前に利用規約への同意を必須にしている:
 * 規約の要点(不適切なコンテンツ・迷惑行為を容認しない)を表示し、チェックを入れるまで
 * ログインボタンは押せない。showAppleがfalseのとき(Androidアプリ)はAppleボタンを出さない。
 * 呼び出し元はlib/auth/AuthProvider.tsx。
 */
export function AuthSignInSheet({
  open,
  showApple,
  onChoose,
  onDismiss,
}: {
  open: boolean;
  showApple: boolean;
  onChoose: (provider: "apple" | "google") => void;
  onDismiss: () => void;
}) {
  // 開くたびに中身を作り直す(=同意のチェックは毎回外れた状態から始まり、毎回明示的に同意してもらう)
  if (!open) return null;
  return <AuthSignInSheetBody showApple={showApple} onChoose={onChoose} onDismiss={onDismiss} />;
}

function AuthSignInSheetBody({
  showApple,
  onChoose,
  onDismiss,
}: {
  showApple: boolean;
  onChoose: (provider: "apple" | "google") => void;
  onDismiss: () => void;
}) {
  const t = getDict(useLang()).auth;
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onDismiss();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onDismiss]);

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

        {/* 利用規約の要点と、同意のチェック(同意するまでログインボタンは押せない) */}
        <div className="rounded-xl border border-line bg-background p-3">
          <p className="text-xs leading-relaxed text-foreground">{t.termsNotice}</p>
          <label className="mt-3 flex cursor-pointer items-start gap-2 text-sm font-medium text-foreground">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(event) => setAgreed(event.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-[#2563eb]"
            />
            <span>{t.termsAgree}</span>
          </label>
          <Link
            href="/terms"
            onClick={onDismiss}
            className="mt-2 inline-block text-xs text-accent underline underline-offset-2"
          >
            {t.termsLink}
          </Link>
        </div>

        {/* Apple公式ロゴ(AppleSignInLogo)+文字を中央に並べた黒ボタン。ロゴの形/色は変えない */}
        {showApple && (
          <button
            type="button"
            disabled={!agreed}
            onClick={() => onChoose("apple")}
            className="flex h-11 cursor-pointer items-center justify-center gap-2 rounded-full bg-black px-6 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <AppleSignInLogo />
            {t.appleButton}
          </button>
        )}

        {/*
          Google公式ガイドライン(developers.google.com/identity/branding-guidelines)のライトテーマ:
          白地・1px #747775の枠・文字 #1F1F1F・公式の「G」ロゴ(Googleの配布素材 g-logo.png、色・比率は変えない)
        */}
        <button
          type="button"
          disabled={!agreed}
          onClick={() => onChoose("google")}
          className="flex h-11 cursor-pointer items-center justify-center gap-2.5 rounded-full border border-[#747775] bg-white px-6 text-sm font-medium text-[#1F1F1F] transition-colors hover:bg-[#f3f3f3] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- 公式素材をそのまま表示するため */}
          <img src="/brand/google-g.png" alt="" width={20} height={20.4} className="h-5 w-auto" />
          {t.googleButton}
        </button>

        {!agreed && <p className="text-center text-[11px] text-muted">{t.termsRequired}</p>}
      </div>
    </div>
  );
}
