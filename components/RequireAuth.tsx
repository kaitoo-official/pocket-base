"use client";

import type { ReactNode } from "react";
import { LogIn, Lock } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { signInWithGoogle } from "@/lib/auth/googleAuth";
import { useLang } from "@/lib/i18n/LanguageProvider";

/**
 * ログイン必須ページ用のガード。未ログイン時は403にはせず、
 * その場でGoogleログインできる誘導画面を表示する。
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { isSignedIn, loading } = useAuth();
  const lang = useLang();

  if (loading) {
    return <div className="mx-auto max-w-4xl px-4 py-20" />;
  }

  if (!isSignedIn) {
    return (
      <main className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-20 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#0b2d5b]/10 text-accent">
          <Lock className="h-6 w-6" />
        </span>
        <h1 className="text-xl font-bold text-foreground">
          {lang === "en" ? "Sign in required" : "ログインが必要です"}
        </h1>
        <p className="text-sm text-muted">
          {lang === "en"
            ? "Sign in with Google to use this page."
            : "この機能を利用するにはGoogleでログインしてください。"}
        </p>
        <button
          type="button"
          onClick={() => void signInWithGoogle()}
          className="mt-2 inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors duration-150 hover:bg-accent-strong"
        >
          <LogIn className="h-4 w-4" />
          {lang === "en" ? "Sign in with Google" : "Googleでログイン"}
        </button>
      </main>
    );
  }

  return <>{children}</>;
}
