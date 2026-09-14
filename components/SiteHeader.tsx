"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeftRight, Home, LayoutGrid, PlayingCardsFan } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Container } from "@/components/Container";
import { LanguageToggle } from "@/components/LanguageToggle";
import { AuthMenu } from "@/components/AuthMenu";
import { subscribeToTradePosts } from "@/lib/trade";
import { countUnreadPosts } from "@/lib/tradeNotifications";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { getDict } from "@/lib/i18n/dict";

const NAV_ITEMS = [
  { href: "/", key: "home" as const, Icon: Home },
  { href: "/cards", key: "cards" as const, Icon: LayoutGrid },
  { href: "/packs", key: "packs" as const, Icon: PlayingCardsFan },
  { href: "/trade", key: "trade" as const, Icon: ArrowLeftRight },
];

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** 全ページ共通のヘッダー。アプリ名とページ間の移動リンクを表示する */
export function SiteHeader() {
  const pathname = usePathname();
  const lang = useLang();
  const t = getDict(lang).nav;
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const unsubscribe = subscribeToTradePosts((posts) => {
      setUnreadCount(countUnreadPosts(posts));
    });
    return unsubscribe;
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-background/80 backdrop-blur-md">
      <Container className="flex h-16 items-center justify-between">
        <Link href="/">
          <Logo />
        </Link>
        <nav className="flex items-center gap-1 text-sm font-medium">
          {NAV_ITEMS.map(({ href, key, Icon }) => {
            const active = isActivePath(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                className={`relative flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-colors duration-150 ${
                  active
                    ? "bg-[#0b2d5b] text-white"
                    : "text-muted hover:bg-[#0b2d5b]/10 hover:text-foreground"
                }`}
              >
                <span className="relative">
                  <Icon className="h-5 w-5" />
                  {href === "/trade" && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </span>
                <span className="hidden sm:inline">{t[key]}</span>
              </Link>
            );
          })}
          <LanguageToggle />
          <AuthMenu />
        </nav>
      </Container>
    </header>
  );
}
