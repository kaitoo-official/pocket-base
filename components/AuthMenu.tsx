"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeftRight,
  ChevronDown,
  Heart,
  LayoutList,
  LogIn,
  LogOut,
  User as UserIcon,
  Layers,
} from "lucide-react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { signInWithGoogle, signOutOfGoogle } from "@/lib/auth/googleAuth";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { getDict } from "@/lib/i18n/dict";

const MENU_ITEM_CLASS =
  "flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-surface-hover";

/** ヘッダー右上の認証導線。未ログインならログインボタン、ログイン済みならプロフィール+ドロップダウン */
export function AuthMenu() {
  const { user, isSignedIn, loading } = useAuth();
  const lang = useLang();
  const t = getDict(lang).auth;
  const [open, setOpen] = useState(false);
  const [signingIn, setSigningIn] = useState(false);

  if (loading) {
    // セッション復元中はボタンをガタつかせないよう、同じ大きさの空枠だけ出す
    return <div className="h-9 w-9 rounded-full" />;
  }

  if (!isSignedIn) {
    return (
      <button
        type="button"
        disabled={signingIn}
        onClick={async () => {
          setSigningIn(true);
          await signInWithGoogle();
          setSigningIn(false);
        }}
        className="flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-sm font-semibold text-white shadow-xs transition-colors duration-150 hover:bg-accent-strong disabled:opacity-60"
      >
        <LogIn className="h-4 w-4" />
        <span className="hidden sm:inline">{t.signIn}</span>
      </button>
    );
  }

  const menuLinks = [
    { href: "/mypage", label: t.myPage, Icon: UserIcon },
    { href: "/wishlist", label: t.wishlist, Icon: Heart },
    { href: "/collection", label: t.collection, Icon: Layers },
    { href: "/decks", label: t.myDecks, Icon: LayoutList },
    { href: "/mypage/trades", label: t.tradeManagement, Icon: ArrowLeftRight },
  ];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-full py-1 pl-1 pr-2 transition-colors duration-150 hover:bg-[#0b2d5b]/10"
      >
        {user?.photoURL ? (
          <Image
            src={user.photoURL}
            alt=""
            width={28}
            height={28}
            className="rounded-full"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-white">
            <UserIcon className="h-4 w-4" />
          </span>
        )}
        <span className="hidden max-w-24 truncate text-sm font-medium text-foreground sm:inline">
          {user?.displayName}
        </span>
        <ChevronDown className={`h-4 w-4 text-muted transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <>
          {/* メニュー外クリックで閉じるための透明オーバーレイ */}
          <button
            type="button"
            aria-hidden="true"
            tabIndex={-1}
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-line bg-surface shadow-lg">
            <div className="border-b border-line px-4 py-3">
              <p className="truncate text-sm font-semibold text-foreground">{user?.displayName}</p>
              <p className="truncate text-xs text-muted">{user?.email}</p>
            </div>
            {menuLinks.map(({ href, label, Icon }) => (
              <Link key={href} href={href} className={MENU_ITEM_CLASS} onClick={() => setOpen(false)}>
                <Icon className="h-4 w-4 text-muted" />
                {label}
              </Link>
            ))}
            <button
              type="button"
              onClick={async () => {
                setOpen(false);
                await signOutOfGoogle();
              }}
              className={`${MENU_ITEM_CLASS} w-full border-t border-line text-left`}
            >
              <LogOut className="h-4 w-4 text-muted" />
              {t.signOut}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
