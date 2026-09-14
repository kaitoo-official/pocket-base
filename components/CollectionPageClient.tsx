"use client";

import { useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Minus, Plus, Trash2 } from "lucide-react";
import { RequireAuth } from "@/components/RequireAuth";
import { AccountShell } from "@/components/AccountShell";
import { TypeBadge } from "@/components/TypeBadge";
import { RarityBadge } from "@/components/RarityBadge";
import { useCollection, MAX_COLLECTION_QUANTITY } from "@/lib/collection";
import { getDict } from "@/lib/i18n/dict";
import type { CardOption } from "@/lib/trade";
import type { Lang } from "@/lib/i18n/lang";

// 枚数が増えるほど目立つ色になるようにしている(1枚=青 → 2枚=緑 → 3枚以上=金)
const QUANTITY_BADGE_COLORS: Record<number, string> = {
  1: "bg-sky-500",
  2: "bg-emerald-500",
  3: "bg-amber-500",
};

function QuantityBadge({ quantity }: { quantity: number }) {
  return (
    <span
      className={`flex h-7 min-w-7 items-center justify-center rounded-full px-1.5 text-xs font-bold text-white shadow-md ring-1 ring-line ${
        QUANTITY_BADGE_COLORS[quantity] ?? "bg-muted"
      }`}
    >
      {quantity >= MAX_COLLECTION_QUANTITY ? `${MAX_COLLECTION_QUANTITY}+` : quantity}
    </span>
  );
}

// このページは自分の所持カード一覧そのものが数量に依存しているため(0枚にしたら一覧から
// 消える必要がある)、カード検索一覧のCollectionStepper(自前でuseCollection()を呼ぶ自己完結型)
// ではなく、親から渡されたquantity/onChangeで動く「制御された」ステッパーをこの場所だけで使う。
function CollectionCardTile({
  card,
  quantity,
  onChange,
  lang,
}: {
  card: CardOption;
  quantity: number;
  onChange: (next: number) => void;
  lang: Lang;
}) {
  return (
    <div className="group relative flex flex-col rounded-xl border border-line bg-surface p-2 shadow-xs transition duration-200 hover:-translate-y-1 hover:border-accent/40 hover:shadow-md">
      <Link href={`/cards/${card.id}`} className="flex flex-col">
        <div className="relative aspect-[245/342] w-full overflow-hidden rounded-lg bg-background">
          <Image
            src={card.image}
            alt={card.name}
            fill
            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 22vw, 16vw"
            className="object-contain transition group-hover:scale-[1.03]"
          />
        </div>
        <div className="mt-2 flex flex-col gap-1">
          <p className="truncate text-sm font-semibold text-foreground">{card.name}</p>
          <div className="flex items-center gap-1.5">
            <TypeBadge type={card.type} lang={lang} />
            <RarityBadge rarity={card.rarity} shiny={card.shiny} lang={lang} />
          </div>
        </div>
      </Link>

      <div className="absolute -top-2 -right-2">
        <QuantityBadge quantity={quantity} />
      </div>

      <div className="mt-2 flex items-center justify-center gap-2 border-t border-line pt-2">
        <button
          type="button"
          disabled={quantity <= 0}
          onClick={() => onChange(quantity - 1)}
          aria-label={
            quantity === 1
              ? lang === "en"
                ? "Remove from collection"
                : "コレクションから削除"
              : lang === "en"
                ? "Decrease quantity"
                : "枚数を減らす"
          }
          className={`flex h-6 w-6 items-center justify-center rounded-full border transition-colors disabled:opacity-40 ${
            quantity === 1
              ? "border-line text-red-600 hover:border-red-300 hover:bg-red-50"
              : "border-line text-foreground hover:border-accent/40"
          }`}
        >
          {quantity === 1 ? <Trash2 className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
        </button>
        <button
          type="button"
          disabled={quantity >= MAX_COLLECTION_QUANTITY}
          onClick={() => onChange(quantity + 1)}
          aria-label={lang === "en" ? "Increase quantity" : "枚数を増やす"}
          className="flex h-6 w-6 items-center justify-center rounded-full border border-line text-foreground transition-colors hover:border-accent/40 disabled:opacity-40"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function CollectionContent({ cards, lang }: { cards: CardOption[]; lang: Lang }) {
  const t = getDict(lang).collection;
  const { quantities, setQuantity, loading } = useCollection();
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
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {ownedCards.map((card) => (
            <CollectionCardTile
              key={card.id}
              card={card}
              quantity={quantities[card.id] ?? 0}
              onChange={(next) => void setQuantity(card.id, next)}
              lang={lang}
            />
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
