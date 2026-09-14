"use client";

import { useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { RequireAuth } from "@/components/RequireAuth";
import { AccountShell } from "@/components/AccountShell";
import { CollectionQuantityControl } from "@/components/CollectionQuantityControl";
import { useCollection } from "@/lib/collection";
import { getDict } from "@/lib/i18n/dict";
import type { CardOption } from "@/lib/trade";
import type { Lang } from "@/lib/i18n/lang";

function CollectionContent({ cards, lang }: { cards: CardOption[]; lang: Lang }) {
  const t = getDict(lang).collection;
  const { quantities, loading } = useCollection();
  const cardMap = useMemo(() => new Map(cards.map((c) => [c.id, c])), [cards]);
  const ownedCards = Object.keys(quantities)
    .map((id) => cardMap.get(id))
    .filter((c): c is CardOption => Boolean(c));

  return (
    <AccountShell>
      <h1 className="text-xl font-bold text-foreground">{t.title}</h1>
      <p className="mt-1 text-sm text-muted">{t.description}</p>

      {!loading && ownedCards.length === 0 ? (
        <p className="mt-8 text-sm text-muted">{t.empty}</p>
      ) : (
        <div className="mt-6 space-y-3">
          {ownedCards.map((card) => (
            <div
              key={card.id}
              className="flex items-center gap-4 rounded-xl border border-line bg-surface p-3 shadow-xs"
            >
              <Link
                href={`/cards/${card.id}`}
                className="relative h-20 w-14 shrink-0 overflow-hidden rounded-lg bg-background"
              >
                <Image src={card.image} alt={card.name} fill sizes="56px" className="object-contain" />
              </Link>
              <p className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">{card.name}</p>
              <CollectionQuantityControl cardId={card.id} lang={lang} />
            </div>
          ))}
        </div>
      )}
    </AccountShell>
  );
}

export function CollectionPageClient({ cards, lang }: { cards: CardOption[]; lang: Lang }) {
  return (
    <RequireAuth>
      <CollectionContent cards={cards} lang={lang} />
    </RequireAuth>
  );
}
