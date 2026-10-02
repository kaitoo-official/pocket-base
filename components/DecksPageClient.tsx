"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2, Pencil, AlertTriangle } from "lucide-react";
import { DeckCardBrowser } from "@/components/DeckCardBrowser";
import { DeckCardBrowserTile } from "@/components/DeckCardBrowserTile";
import { AccountShell } from "@/components/AccountShell";
import { TypeIcon } from "@/components/TypeIcon";
import { useDecks, type Deck } from "@/lib/decks";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useCollection } from "@/lib/collection";
import {
  validateDeck,
  isDeckValid,
  getDeckOwnershipInfo,
  addCardToDeck,
  removeCardFromDeck,
  countCardInDeck,
  DECK_ENERGY_TYPES,
  type DeckValidationFlags,
} from "@/lib/deckValidation";
import { getTypeLabel } from "@/lib/typeLabels";
import { getDict } from "@/lib/i18n/dict";
import type { DeckBrowserCard } from "@/lib/deckBrowserCards";
import type { Option } from "@/lib/filterOptions";
import type { Lang } from "@/lib/i18n/lang";

const MAX_DECK_CARDS = 20;
const MAX_PER_CARD = 2;

type Mode = { type: "list" } | { type: "create" } | { type: "edit"; deck: Deck };

/** 本家の「デッキ保存」警告ダイアログを再現したモーダル。OKでそのまま保存を続行する */
function ValidationWarningModal({
  flags,
  lang,
  onCancel,
  onConfirm,
}: {
  flags: DeckValidationFlags;
  lang: Lang;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const t = getDict(lang).decks;
  const issues = [
    !flags.exactSize && t.issueExactSize,
    !flags.hasBasicPokemon && t.issueBasicPokemon,
    !flags.hasEnergySet && t.issueEnergySet,
  ].filter((issue): issue is string => Boolean(issue));

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0B2D5B]/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-surface p-6 shadow-xl">
        <h2 className="text-center text-base font-bold text-foreground">{t.validationTitle}</h2>
        <p className="mt-3 text-sm text-muted">{t.validationIntro}</p>
        <ul className="mt-2 space-y-1">
          {issues.map((issue) => (
            <li key={issue} className="flex items-start gap-1.5 text-sm text-foreground">
              <span>・</span>
              {issue}
            </li>
          ))}
        </ul>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-hover"
          >
            {t.cancel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-accent-strong"
          >
            {t.saveAnyway}
          </button>
        </div>
      </div>
    </div>
  );
}

function EnergyTypeSelector({
  value,
  onChange,
  lang,
}: {
  value: string[];
  onChange: (types: string[]) => void;
  lang: Lang;
}) {
  const t = getDict(lang).decks;

  function toggle(type: string) {
    onChange(value.includes(type) ? value.filter((v) => v !== type) : [...value, type]);
  }

  return (
    <div className="mt-4">
      <p className="mb-1.5 text-sm font-semibold text-foreground">{t.energyLabel}</p>
      <div className="flex flex-wrap gap-2">
        {DECK_ENERGY_TYPES.map((type) => {
          const active = value.includes(type);
          return (
            <button
              key={type}
              type="button"
              onClick={() => toggle(type)}
              aria-pressed={active}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                active
                  ? "border-accent bg-accent/10 text-accent-strong"
                  : "border-line text-muted hover:border-accent/40"
              }`}
            >
              <TypeIcon type={type} className="h-4 w-4" />
              {getTypeLabel(type, lang)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** 現在デッキに入っているカードを、種類ごとに(枚数バッジ付きで)表示するコンパクトなグリッド */
function SelectedDeckCards({
  cardIds,
  cardMap,
  lang,
  ownedQuantities,
  onChange,
  onOpenBrowser,
}: {
  cardIds: string[];
  cardMap: Map<string, DeckBrowserCard>;
  lang: Lang;
  ownedQuantities: Record<string, number> | null;
  onChange: (ids: string[]) => void;
  onOpenBrowser: () => void;
}) {
  const t = getDict(lang).decks.browser;
  const uniqueIds = useMemo(() => [...new Set(cardIds)], [cardIds]);

  if (uniqueIds.length === 0) {
    return (
      <button
        type="button"
        onClick={onOpenBrowser}
        className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line bg-surface px-4 py-10 text-muted transition-colors duration-150 hover:border-accent/40 hover:bg-surface-hover"
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-strong text-white shadow-md">
          <Plus className="h-6 w-6" />
        </span>
        <span className="text-sm font-semibold text-foreground">{t.openButton}</span>
      </button>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-2 rounded-xl border border-line bg-surface p-2 sm:grid-cols-6">
      {uniqueIds.map((id) => {
        const card = cardMap.get(id);
        if (!card) return null;
        return (
          <DeckCardBrowserTile
            key={id}
            card={card}
            lang={lang}
            count={countCardInDeck(cardIds, id)}
            maxPerCard={MAX_PER_CARD}
            ownedQuantity={ownedQuantities ? (ownedQuantities[id] ?? 0) : null}
            onAdd={() => onChange(addCardToDeck(cardIds, id, MAX_DECK_CARDS, MAX_PER_CARD))}
            onRemove={() => onChange(removeCardFromDeck(cardIds, id))}
          />
        );
      })}
      {cardIds.length < MAX_DECK_CARDS && (
        <button
          type="button"
          onClick={onOpenBrowser}
          aria-label={t.openButton}
          className="flex aspect-[245/342] items-center justify-center rounded-lg border-2 border-dashed border-line text-muted transition-colors duration-150 hover:border-accent/40 hover:bg-surface-hover"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-strong text-white">
            <Plus className="h-4 w-4" />
          </span>
        </button>
      )}
    </div>
  );
}

function DeckForm({
  cards,
  typeOptions,
  rarityOptions,
  stageOptions,
  seriesOptions,
  packOptionsBySeries,
  lang,
  ownedQuantities,
  initial,
  onCancel,
  onSave,
}: {
  cards: DeckBrowserCard[];
  typeOptions: Option[];
  rarityOptions: Option[];
  stageOptions: Option[];
  seriesOptions: Option[];
  packOptionsBySeries: Record<string, Option[]>;
  lang: Lang;
  ownedQuantities: Record<string, number> | null;
  initial?: Deck;
  onCancel: () => void;
  onSave: (name: string, cardIds: string[], energyTypes: string[]) => Promise<void>;
}) {
  const t = getDict(lang).decks;
  const [name, setName] = useState(initial?.deckName ?? "");
  const [cardIds, setCardIds] = useState<string[]>(initial?.cards ?? []);
  const [energyTypes, setEnergyTypes] = useState<string[]>(initial?.energyTypes ?? []);
  const [saving, setSaving] = useState(false);
  const [pendingFlags, setPendingFlags] = useState<DeckValidationFlags | null>(null);
  const [browserOpen, setBrowserOpen] = useState(false);

  const cardMap = useMemo(() => new Map(cards.map((card) => [card.id, card])), [cards]);
  const ownershipInfo = useMemo(
    () => getDeckOwnershipInfo(cardIds, ownedQuantities),
    [cardIds, ownedQuantities]
  );

  async function doSave() {
    setSaving(true);
    await onSave(name.trim(), cardIds, energyTypes);
    setSaving(false);
  }

  function handleSaveClick() {
    const flags = validateDeck(cardIds, energyTypes, cardMap);
    if (!isDeckValid(flags)) {
      setPendingFlags(flags);
      return;
    }
    void doSave();
  }

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
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">
            {t.browser.deckCount(String(cardIds.length), String(MAX_DECK_CARDS))}
          </p>
          <button
            type="button"
            onClick={() => setBrowserOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-foreground shadow-xs transition-colors hover:border-accent/40 hover:bg-surface-hover"
          >
            <Plus className="h-3.5 w-3.5 text-accent" />
            {t.browser.openButton}
          </button>
        </div>
        <SelectedDeckCards
          cardIds={cardIds}
          cardMap={cardMap}
          lang={lang}
          ownedQuantities={ownedQuantities}
          onChange={setCardIds}
          onOpenBrowser={() => setBrowserOpen(true)}
        />
        {ownershipInfo && ownershipInfo.missingCount > 0 && (
          <p className="mt-2 text-xs text-muted">
            {t.browser.missingSummary(String(ownershipInfo.missingCount))}
          </p>
        )}
      </div>

      <EnergyTypeSelector value={energyTypes} onChange={setEnergyTypes} lang={lang} />
      <div className="mt-4 flex items-center justify-end gap-2">
        {!name.trim() && (
          <p className="mr-auto text-xs font-medium text-red-600">{t.nameRequired}</p>
        )}
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
          onClick={handleSaveClick}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-accent-strong disabled:opacity-60"
        >
          {t.save}
        </button>
      </div>

      {pendingFlags && (
        <ValidationWarningModal
          flags={pendingFlags}
          lang={lang}
          onCancel={() => setPendingFlags(null)}
          onConfirm={() => {
            setPendingFlags(null);
            void doSave();
          }}
        />
      )}

      <DeckCardBrowser
        open={browserOpen}
        onClose={() => setBrowserOpen(false)}
        cards={cards}
        lang={lang}
        value={cardIds}
        onChange={setCardIds}
        max={MAX_DECK_CARDS}
        maxPerCard={MAX_PER_CARD}
        typeOptions={typeOptions}
        rarityOptions={rarityOptions}
        stageOptions={stageOptions}
        seriesOptions={seriesOptions}
        packOptionsBySeries={packOptionsBySeries}
      />
    </div>
  );
}

export function DecksPageClient({
  cards,
  typeOptions,
  rarityOptions,
  stageOptions,
  seriesOptions,
  packOptionsBySeries,
  lang,
}: {
  cards: DeckBrowserCard[];
  typeOptions: Option[];
  rarityOptions: Option[];
  stageOptions: Option[];
  seriesOptions: Option[];
  packOptionsBySeries: Record<string, Option[]>;
  lang: Lang;
}) {
  const t = getDict(lang).decks;
  const { isSignedIn } = useAuth();
  const { quantities } = useCollection();
  const { decks, loading, createDeck, updateDeck, deleteDeck, canCreateMore } = useDecks();
  const [mode, setMode] = useState<Mode>({ type: "list" });
  const [limitNotice, setLimitNotice] = useState(false);

  const cardMap = useMemo(() => new Map(cards.map((card) => [card.id, card])), [cards]);
  // 未ログイン時はマイコレクションが無いため「所持カードのみ」表示の対象外にする
  const ownedQuantities = isSignedIn ? quantities : null;

  return (
    <AccountShell>
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
              {decks.map((deck) => {
                const flags = validateDeck(deck.cards, deck.energyTypes, cardMap);
                const valid = isDeckValid(flags);
                return (
                  <div
                    key={deck.id}
                    className="flex items-center justify-between rounded-xl border border-line bg-surface p-4 shadow-xs"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-semibold text-foreground">{deck.deckName}</p>
                        {!valid && (
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-600">
                            <AlertTriangle className="h-3 w-3" />
                            {t.invalidBadge}
                          </span>
                        )}
                      </div>
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
                );
              })}
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
            stageOptions={stageOptions}
            seriesOptions={seriesOptions}
            packOptionsBySeries={packOptionsBySeries}
            lang={lang}
            ownedQuantities={ownedQuantities}
            onCancel={() => setMode({ type: "list" })}
            onSave={async (name, cardIds, energyTypes) => {
              const result = await createDeck(name, cardIds, energyTypes);
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
            stageOptions={stageOptions}
            seriesOptions={seriesOptions}
            packOptionsBySeries={packOptionsBySeries}
            lang={lang}
            ownedQuantities={ownedQuantities}
            initial={mode.deck}
            onCancel={() => setMode({ type: "list" })}
            onSave={async (name, cardIds, energyTypes) => {
              if (mode.type !== "edit") return;
              await updateDeck(mode.deck.id, name, cardIds, energyTypes);
              setMode({ type: "list" });
            }}
          />
        </div>
      )}
    </AccountShell>
  );
}
