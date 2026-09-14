"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, User as UserIcon, Heart, Layers, LayoutList, ArrowLeftRight } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { signOutOfGoogle } from "@/lib/auth/googleAuth";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { getDict } from "@/lib/i18n/dict";

/** マイページ系のページ間を移動するための、常設のサイドナビゲーション */
export function AccountSidebar() {
  const pathname = usePathname();
  const { isSignedIn } = useAuth();
  const lang = useLang();
  const t = getDict(lang).auth;

  const items = [
    { href: "/mypage", label: t.myPage, Icon: UserIcon },
    { href: "/wishlist", label: t.wishlist, Icon: Heart },
    { href: "/collection", label: t.collection, Icon: Layers },
    { href: "/decks", label: t.myDecks, Icon: LayoutList },
    { href: "/mypage/trades", label: t.tradeManagement, Icon: ArrowLeftRight },
  ];

  return (
    <nav className="hero-dark w-full shrink-0 rounded-2xl border border-line bg-hero-gradient-dark p-3 sm:w-56">
      <div className="space-y-1">
        {items.map(({ href, label, Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                active ? "bg-accent text-white" : "text-muted hover:bg-white/5 hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </div>
      {isSignedIn && (
        <div className="mt-3 border-t border-line pt-3">
          <button
            type="button"
            onClick={() => void signOutOfGoogle()}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-white/5 hover:text-foreground"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {t.signOut}
          </button>
        </div>
      )}
    </nav>
  );
}
