"use client";

import { useMemo } from "react";
import { X } from "lucide-react";
import { RequireAuth } from "@/components/RequireAuth";
import { AccountShell } from "@/components/AccountShell";
import { CardOptionTile } from "@/components/CardOptionTile";
import { useWishlist } from "@/lib/wishlist";
import { getDict } from "@/lib/i18n/dict";
import type { CardOption } from "@/lib/trade";
import type { Lang } from "@/lib/i18n/lang";

function WishlistContent({ cards, lang }: { cards: CardOption[]; lang: Lang }) {
  const t = getDict(lang).wishlist;
  const { wishlistIds, toggleWishlist, loading } = useWishlist();
  const cardMap = useMemo(() => new Map(cards.map((c) => [c.id, c])), [cards]);
  const wishlistedCards = wishlistIds
    .map((id) => cardMap.get(id))
    .filter((c): c is CardOption => Boolean(c));

  return (
    <AccountShell>
      <h1 className="text-xl font-bold text-foreground">{t.title}</h1>
      <p className="mt-1 text-sm text-muted">{t.description}</p>

      {!loading && wishlistedCards.length === 0 ? (
        <p className="mt-8 text-sm text-muted">{t.empty}</p>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {wishlistedCards.map((card) => (
            <CardOptionTile
              key={card.id}
              card={card}
              lang={lang}
              action={
                <button
                  type="button"
                  onClick={() => void toggleWishlist(card.id)}
                  aria-label={t.remove}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 shadow-xs backdrop-blur-sm transition-transform hover:scale-110"
                >
                  <X className="h-4 w-4 text-muted" />
                </button>
              }
            />
          ))}
        </div>
      )}
    </AccountShell>
  );
}

export function WishlistPageClient({ cards, lang }: { cards: CardOption[]; lang: Lang }) {
  return (
    <RequireAuth>
      <WishlistContent cards={cards} lang={lang} />
    </RequireAuth>
  );
}
