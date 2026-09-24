"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Capacitor } from "@capacitor/core";
import { LayoutGrid, PlayingCardsFan, ArrowLeftRight, User } from "lucide-react";

const TABS = [
  { href: "/cards", label: "カード", Icon: LayoutGrid },
  { href: "/packs", label: "パック", Icon: PlayingCardsFan },
  { href: "/trade", label: "トレード", Icon: ArrowLeftRight },
  { href: "/mypage", label: "マイページ", Icon: User },
];

/**
 * アプリ版(Capacitor)でのみ表示する下タブバー。
 * Webサイトとして見ている場合はnullを返し、何も表示しない。
 * document.bodyにクラスを付けて、コンテンツがタブバーの下に隠れないよう
 * 余白を確保する(globals.cssの.has-native-bottom-nav参照)。
 */
export function NativeBottomNav() {
  const [isNative, setIsNative] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsNative(Capacitor.isNativePlatform());
  }, []);

  useEffect(() => {
    document.body.classList.toggle("has-native-bottom-nav", isNative);
    return () => document.body.classList.remove("has-native-bottom-nav");
  }, [isNative]);

  if (!isNative) return null;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-line bg-surface pb-[env(safe-area-inset-bottom)]">
      {TABS.map(({ href, label, Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-1 flex-col items-center gap-1 py-2 text-xs font-medium transition-colors ${
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
