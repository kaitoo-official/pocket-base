"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Star, Layers, LayoutList, ArrowLeftRight } from "lucide-react";
import { RequireAuth } from "@/components/RequireAuth";
import { useAuth } from "@/lib/auth/AuthProvider";
import { getCloudFavoriteIds } from "@/lib/favorites";
import { getWishlistEntries } from "@/lib/wishlist";
import { getCollectionEntries } from "@/lib/collection";
import { getCloudDecks } from "@/lib/decks";
import { getMyTradePosts } from "@/lib/trade";
import { getDict } from "@/lib/i18n/dict";
import type { Lang } from "@/lib/i18n/lang";

interface Counts {
  favorites: number;
  wishlist: number;
  collection: number;
  decks: number;
  trades: number;
}

function MyPageContent({ lang }: { lang: Lang }) {
  const t = getDict(lang).mypage;
  const authT = getDict(lang).auth;
  const { user } = useAuth();
  const [counts, setCounts] = useState<Counts | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    Promise.all([
      getCloudFavoriteIds(user.uid),
      getWishlistEntries(user.uid),
      getCollectionEntries(user.uid),
      getCloudDecks(user.uid),
      getMyTradePosts(user.uid),
    ]).then(([favorites, wishlist, collection, decks, trades]) => {
      if (cancelled) return;
      setCounts({
        favorites: favorites.length,
        wishlist: wishlist.length,
        collection: collection.length,
        decks: decks.length,
        trades: trades.length,
      });
    });

    return () => {
      cancelled = true;
    };
  }, [user]);

  const stats: { label: string; value: number | undefined }[] = [
    { label: t.favoritesCount, value: counts?.favorites },
    { label: t.wishlistCount, value: counts?.wishlist },
    { label: t.collectionCount, value: counts?.collection },
    { label: t.decksCount, value: counts?.decks },
    { label: t.tradePostsCount, value: counts?.trades },
  ];

  const shortcuts = [
    { href: "/wishlist", label: authT.wishlist, Icon: Star },
    { href: "/collection", label: authT.collection, Icon: Layers },
    { href: "/decks", label: authT.myDecks, Icon: LayoutList },
    { href: "/mypage/trades", label: authT.tradeManagement, Icon: ArrowLeftRight },
  ];

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <div className="flex items-center gap-4">
        {user?.photoURL && (
          <Image
            src={user.photoURL}
            alt=""
            width={56}
            height={56}
            className="rounded-full"
            referrerPolicy="no-referrer"
          />
        )}
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold text-foreground">{user?.displayName}</h1>
          <p className="truncate text-sm text-muted">{user?.email}</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-line bg-surface p-4 text-center shadow-xs">
            <p className="text-2xl font-bold text-foreground">{stat.value ?? "…"}</p>
            <p className="mt-1 text-xs text-muted">{stat.label}</p>
          </div>
        ))}
      </div>

      <h2 className="mt-8 text-sm font-semibold text-muted">{t.shortcuts}</h2>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {shortcuts.map(({ href, label, Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center gap-2 rounded-xl border border-line bg-surface p-4 text-center shadow-xs transition duration-200 hover:-translate-y-1 hover:border-accent/40 hover:shadow-md"
          >
            <Icon className="h-6 w-6 text-accent" />
            <span className="text-xs font-medium text-foreground">{label}</span>
          </Link>
        ))}
      </div>
    </main>
  );
}

export function MyPageClient({ lang }: { lang: Lang }) {
  return (
    <RequireAuth>
      <MyPageContent lang={lang} />
    </RequireAuth>
  );
}
