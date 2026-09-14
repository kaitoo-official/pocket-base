"use client";

import { useState } from "react";
import { Plus, Trash2, Pencil } from "lucide-react";
import { CardPicker } from "@/components/CardPicker";
import { useDecks, type Deck } from "@/lib/decks";
import { getDict } from "@/lib/i18n/dict";
import type { CardOption } from "@/lib/trade";
import type { Option } from "@/lib/filterOptions";
import type { Lang } from "@/lib/i18n/lang";

const MAX_DECK_CARDS = 20;

type Mode = { type: "list" } | { type: "create" } | { type: "edit"; deck: Deck };

function DeckForm({
  cards,
  typeOptions,
  rarityOptions,
  lang,
  initial,
  onCancel,
  onSave,
}: {
  cards: CardOption[];
  typeOptions: Option[];
  rarityOptions: Option[];
  lang: Lang;
  initial?: Deck;
  onCancel: () => void;
  onSave: (name: string, cardIds: string[]) => Promise<void>;
}) {
  const t = getDict(lang).decks;
  const [name, setName] = useState(initial?.deckName ?? "");
  const [cardIds, setCardIds] = useState<string[]>(initial?.cards ?? []);
  const [saving, setSaving] = useState(false);

  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <input
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder={t.deckNamePlaceholder}
        maxLength={50}
        className="w-full rounded-lg border border-line bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
      />
      <div className="mt-4">
        <CardPicker
          label={t.cardsCount(String(cardIds.length))}
          cards={cards}
          typeOptions={typeOptions}
          rarityOptions={rarityOptions}
          value={cardIds}
          onChange={setCardIds}
          max={MAX_DECK_CARDS}
        />
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-hover"
        >
          {t.cancel}
        </button>
        <button
          type="button"
          disabled={saving || !name.trim()}
          onClick={async () => {
            setSaving(true);
            await onSave(name.trim(), cardIds);
            setSaving(false);
          }}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-accent-strong disabled:opacity-60"
        >
          {t.save}
        </button>
      </div>
    </div>
  );
}

export function DecksPageClient({
  cards,
  typeOptions,
  rarityOptions,
  lang,
}: {
  cards: CardOption[];
  typeOptions: Option[];
  rarityOptions: Option[];
  lang: Lang;
}) {
  const t = getDict(lang).decks;
  const { decks, loading, createDeck, updateDeck, deleteDeck, canCreateMore } = useDecks();
  const [mode, setMode] = useState<Mode>({ type: "list" });
  const [limitNotice, setLimitNotice] = useState(false);

  return (
    <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      <h1 className="text-xl font-bold text-foreground">{t.title}</h1>
      <p className="mt-1 text-sm text-muted">{t.description}</p>

      {mode.type === "list" && (
        <>
          <div className="mt-6 flex items-center justify-between">
            <button
              type="button"
              onClick={() => (canCreateMore ? setMode({ type: "create" }) : setLimitNotice(true))}
              className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-accent-strong"
            >
              <Plus className="h-4 w-4" />
              {t.newDeck}
            </button>
          </div>
          {(!canCreateMore || limitNotice) && (
            <p className="mt-2 text-xs font-semibold text-red-600">{t.limitMessage}</p>
          )}

          {!loading && decks.length === 0 ? (
            <p className="mt-8 text-sm text-muted">{t.empty}</p>
          ) : (
            <div className="mt-4 space-y-3">
              {decks.map((deck) => (
                <div
                  key={deck.id}
                  className="flex items-center justify-between rounded-xl border border-line bg-surface p-4 shadow-xs"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-foreground">{deck.deckName}</p>
                    <p className="text-xs text-muted">{t.cardsCount(String(deck.cards.length))}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setMode({ type: "edit", deck })}
                      aria-label={t.save}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-line text-foreground transition-colors hover:border-accent/40"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void deleteDeck(deck.id)}
                      aria-label={t.delete}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-line text-red-600 transition-colors hover:border-red-300 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {mode.type === "create" && (
        <div className="mt-6">
          <DeckForm
            cards={cards}
            typeOptions={typeOptions}
            rarityOptions={rarityOptions}
            lang={lang}
            onCancel={() => setMode({ type: "list" })}
            onSave={async (name, cardIds) => {
              const result = await createDeck(name, cardIds);
              if (!result.ok) {
                setLimitNotice(true);
                return;
              }
              setMode({ type: "list" });
            }}
          />
        </div>
      )}

      {mode.type === "edit" && (
        <div className="mt-6">
          <DeckForm
            cards={cards}
            typeOptions={typeOptions}
            rarityOptions={rarityOptions}
            lang={lang}
            initial={mode.deck}
            onCancel={() => setMode({ type: "list" })}
            onSave={async (name, cardIds) => {
              if (mode.type !== "edit") return;
              await updateDeck(mode.deck.id, name, cardIds);
              setMode({ type: "list" });
            }}
          />
        </div>
      )}
    </main>
  );
}
