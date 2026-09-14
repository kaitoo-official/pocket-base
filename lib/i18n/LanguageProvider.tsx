"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Lang } from "@/lib/i18n/langTypes";

const LangContext = createContext<Lang>("ja");

/**
 * 表示言語をアプリ全体に配るためのプロバイダー。
 * app/layout.tsx(サーバーコンポーネント)でCookieから読んだ言語を渡すだけで、
 * クライアントコンポーネント側は useLang() で同じ値を読める。
 */
export function LanguageProvider({ lang, children }: { lang: Lang; children: ReactNode }) {
  return <LangContext.Provider value={lang}>{children}</LangContext.Provider>;
}

export function useLang(): Lang {
  return useContext(LangContext);
}
