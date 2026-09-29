"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, PlayingCardsFan, ArrowLeftRight, User } from "lucide-react";
import { useIsNativeApp } from "@/lib/useIsNativeApp";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { getDict } from "@/lib/i18n/dict";

/**
 * アプリ版(Capacitor)でのみ表示する下タブバー。
 * Webサイトとして見ている場合はnullを返し、何も表示しない。
 * document.bodyにクラスを付けて、コンテンツがタブバーの下に隠れないよう
 * 余白を確保する(globals.cssの.has-native-bottom-nav参照)。
 */
export function NativeBottomNav() {
  const isNative = useIsNativeApp();
  const pathname = usePathname();
  const lang = useLang();
  const nav = getDict(lang).nav;
  const auth = getDict(lang).auth;

  const TABS = [
    { href: "/", label: nav.home, Icon: Home },
    { href: "/cards", label: nav.cards, Icon: LayoutGrid },
    { href: "/packs", label: nav.packs, Icon: PlayingCardsFan },
    { href: "/trade", label: nav.trade, Icon: ArrowLeftRight },
    { href: "/mypage", label: auth.myPage, Icon: User },
  ];

  useEffect(() => {
    document.body.classList.toggle("has-native-bottom-nav", isNative);
    return () => document.body.classList.remove("has-native-bottom-nav");
  }, [isNative]);

  if (!isNative) return null;

  return (
    <nav
      className="fixed inset-x-4 z-40 flex overflow-hidden rounded-2xl border border-line bg-surface/95 shadow-lg shadow-black/10 backdrop-blur-md"
      style={{ bottom: "calc(env(safe-area-inset-bottom) + 12px)" }}
    >
      {TABS.map(({ href, label, Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium whitespace-nowrap transition-colors ${
              active ? "text-accent" : "text-muted"
            }`}
          >
            <Icon className="h-6 w-6" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
