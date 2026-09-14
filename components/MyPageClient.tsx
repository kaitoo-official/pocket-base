"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Heart, Star, Layers, LayoutList, ArrowLeftRight, MessageCircle } from "lucide-react";
import { RequireAuth } from "@/components/RequireAuth";
import { AccountShell } from "@/components/AccountShell";
import { useAuth } from "@/lib/auth/AuthProvider";
import { getCloudFavoriteIds } from "@/lib/favorites";
import { getWishlistEntries } from "@/lib/wishlist";
import { getCollectionEntries } from "@/lib/collection";
import { getCloudDecks } from "@/lib/decks";
import { getMyTradePosts, formatTradeDate, type CardOption, type TradePost } from "@/lib/trade";
import { getDict } from "@/lib/i18n/dict";
import type { Lang } from "@/lib/i18n/lang";

interface Counts {
  favorites: number;
  wishlist: number;
  collection: number;
  decks: number;
}

function PostPreviewCard({ post, cardMap, lang }: { post: TradePost; cardMap: Map<string, CardOption>; lang: Lang }) {
  const closedT = getDict(lang).myTrades;
  const primaryCardId = post.offerCardIds[0] ?? post.wantCardIds[0];
  const primaryCard = primaryCardId ? cardMap.get(primaryCardId) : undefined;
  const title = primaryCard?.name ?? closedT.noCardTitle;

  return (
    <Link
      href="/mypage/trades"
      className="flex flex-col rounded-xl border border-line bg-surface p-4 shadow-xs transition duration-200 hover:-translate-y-1 hover:border-accent/40 hover:shadow-md"
    >
      <div className="flex items-start gap-3">
        <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-lg bg-background">
          {primaryCard && (
            <Image src={primaryCard.image} alt={primaryCard.name} fill sizes="48px" className="object-contain" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
              post.closed ? "bg-line text-muted" : "bg-accent/10 text-accent-strong"
            }`}
          >
            {post.closed ? closedT.closed : closedT.open}
          </span>
          <p className="mt-1 truncate text-sm font-bold text-foreground">{title}</p>
          <p className="text-xs text-muted">{formatTradeDate(post.createdAt, lang)}</p>
        </div>
      </div>
      {post.memo && <p className="mt-2 line-clamp-2 text-xs text-muted">{post.memo}</p>}
      <div className="mt-3 flex items-center gap-1.5 border-t border-line pt-2 text-xs text-muted">
        <MessageCircle className="h-3.5 w-3.5" />
        {post.commentCount}
      </div>
    </Link>
  );
}

function MyPageContent({ cards, lang }: { cards: CardOption[]; lang: Lang }) {
  const t = getDict(lang).mypage;
  const authT = getDict(lang).auth;
  const homeT = getDict(lang).home;
  const { user } = useAuth();
  const [counts, setCounts] = useState<Counts | null>(null);
  const [posts, setPosts] = useState<TradePost[] | null>(null);
  const cardMap = useMemo(() => new Map(cards.map((c) => [c.id, c])), [cards]);

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
      });
      setPosts(trades);
    });

    return () => {
      cancelled = true;
    };
  }, [user]);

  const stats = [
    { label: t.favoritesCount, value: counts?.favorites, Icon: Heart, color: "bg-rose-500" },
    { label: t.wishlistCount, value: counts?.wishlist, Icon: Star, color: "bg-amber-500" },
    { label: t.collectionCount, value: counts?.collection, Icon: Layers, color: "bg-accent" },
    { label: t.decksCount, value: counts?.decks, Icon: LayoutList, color: "bg-indigo-500" },
    { label: t.tradePostsCount, value: posts?.length, Icon: ArrowLeftRight, color: "bg-teal-500" },
  ];

  return (
    <AccountShell>
      <div className="hero-dark flex flex-col gap-4 rounded-2xl border border-line bg-hero-gradient-dark p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          {user?.photoURL && (
            <Image
              src={user.photoURL}
              alt=""
              width={64}
              height={64}
              className="rounded-full"
              referrerPolicy="no-referrer"
            />
          )}
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold text-foreground">{user?.displayName}</h1>
            <p className="truncate text-sm text-muted">{user?.email}</p>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-xl font-extrabold leading-tight tracking-tight text-foreground sm:text-2xl">
            {homeT.heroLine1}
            <br />
            <span className="relative inline-block">
              <span className="relative z-10">{homeT.heroLine2}</span>
              <span className="absolute inset-x-0 bottom-0.5 -z-0 h-2 rounded bg-accent-strong/20 sm:h-2.5" />
            </span>
          </h2>
          <p className="mt-2 text-xs font-medium text-accent-strong">{homeT.tagline}</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {stats.map(({ label, value, Icon, color }) => (
          <div key={label} className="rounded-xl border border-line bg-surface p-4 text-center shadow-xs">
            <span className={`mx-auto flex h-9 w-9 items-center justify-center rounded-full text-white ${color}`}>
              <Icon className="h-4 w-4" />
            </span>
            <p className="mt-2 text-2xl font-bold text-foreground">{value ?? "…"}</p>
            <p className="mt-1 text-xs text-muted">{label}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-lg font-bold tracking-tight text-foreground">{t.myPosts}</h2>
        <Link href="/mypage/trades" className="flex items-center gap-1 text-sm font-medium text-muted hover:text-accent">
          {t.viewAllPosts}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {posts !== null && posts.length === 0 ? (
        <p className="mt-4 text-sm text-muted">{t.noPosts}</p>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {posts?.slice(0, 3).map((post) => (
            <PostPreviewCard key={post.id} post={post} cardMap={cardMap} lang={lang} />
          ))}
        </div>
      )}

      <h2 className="mt-8 text-sm font-semibold text-muted">{t.shortcuts}</h2>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { href: "/wishlist", label: authT.wishlist, Icon: Star },
          { href: "/collection", label: authT.collection, Icon: Layers },
          { href: "/decks", label: authT.myDecks, Icon: LayoutList },
          { href: "/mypage/trades", label: authT.tradeManagement, Icon: ArrowLeftRight },
        ].map(({ href, label, Icon }) => (
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
    </AccountShell>
  );
}

export function MyPageClient({ cards, lang }: { cards: CardOption[]; lang: Lang }) {
  return (
    <RequireAuth>
      <MyPageContent cards={cards} lang={lang} />
    </RequireAuth>
  );
}
