"use client";

import { useMemo, useState } from "react";
import { X, ArrowUpDown } from "lucide-react";
import {
  searchDeckBrowserCards,
  filterDeckBrowserCards,
  sortDeckBrowserCards,
  type DeckBrowserCard,
  type DeckBrowserFilterState,
} from "@/lib/deckBrowserCards";
import { getSortOptions, getDefaultDirection, type SortCriterion, type SortDirection } from "@/lib/sort";
import type { Option } from "@/lib/filterOptions";
import { countCardInDeck, addCardToDeck, removeCardFromDeck } from "@/lib/deckValidation";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useCollection } from "@/lib/collection";
import { DeckCardBrowserTile } from "@/components/DeckCardBrowserTile";
import { getDict } from "@/lib/i18n/dict";
import type { Lang } from "@/lib/i18n/lang";

/**
 * 一度に描画するカード数の上限。デッキ編成では「理想のデッキを探しながら組む」ことを
 * 重視し、トレード用の小さいCardPicker(MAX_RESULTS=40)より広いUIを使えるため、
 * その分だけ上限も大きくしているが、無制限に数千件をDOMへ出すことは避ける。
 */
const MAX_VISIBLE = 120;

const SELECT_CLASS =
  "rounded-lg border border-line bg-background px-2.5 py-1.5 text-xs text-foreground focus:border-accent focus:outline-none";

/**
 * デッキ編成専用の、検索・絞り込み・並び替えができるカード選択UI(Deck Card Browser)。
 * lib/filter.ts・lib/search.ts・lib/sort.ts・lib/filterOptions.tsの既存ロジックをそのまま再利用し、
 * URLではなくローカルstateで条件を保持する(モーダル内でページ遷移せず完結させるため)。
 * トレード用のCardPicker(components/CardPicker.tsx)とは完全に独立しており、そちらの挙動には影響しない。
 */
export function DeckCardBrowser({
  open,
  onClose,
  cards,
  lang,
  value,
  onChange,
  max,
  maxPerCard,
  typeOptions,
  rarityOptions,
  stageOptions,
  seriesOptions,
  packOptionsBySeries,
}: {
  open: boolean;
  onClose: () => void;
  cards: DeckBrowserCard[];
  lang: Lang;
  /** 現在のデッキのcardId配列(同じIDが複数回入りうる=重複が「その枚数」を表す) */
  value: string[];
  onChange: (ids: string[]) => void;
  /** デッキ全体の最大枚数(20) */
  max: number;
  /** 同一カードの最大枚数(2) */
  maxPerCard: number;
  typeOptions: Option[];
  rarityOptions: Option[];
  stageOptions: Option[];
  seriesOptions: Option[];
  /** シリーズ(seriesId)ごとの、そのシリーズ内の個別パック一覧。パックが1種類しか無いシリーズは空配列 */
  packOptionsBySeries: Record<string, Option[]>;
}) {
  const t = getDict(lang).decks.browser;
  const { isSignedIn } = useAuth();
  const { quantities } = useCollection();
  const sortOptions = useMemo(() => getSortOptions(lang), [lang]);

  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [rarityFilter, setRarityFilter] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [seriesFilter, setSeriesFilter] = useState("");
  const [packFilter, setPackFilter] = useState("");
  const [sortCriterion, setSortCriterion] = useState<SortCriterion>("number");
  const [sortDirection, setSortDirection] = useState<SortDirection>(getDefaultDirection("number"));
  const [ownedOnly, setOwnedOnly] = useState(false);

  const packOptionsForSelectedSeries = seriesFilter ? (packOptionsBySeries[seriesFilter] ?? []) : [];

  function handleSeriesChange(nextSeries: string) {
    setSeriesFilter(nextSeries);
    // パックは選んだシリーズの中でしか意味を持たないため、シリーズを変えたら一緒にリセットする
    setPackFilter("");
  }

  const filterState: DeckBrowserFilterState = useMemo(
    () => ({
      types: typeFilter ? [typeFilter] : [],
      rarities: rarityFilter ? [rarityFilter] : [],
      stages: stageFilter ? [stageFilter] : [],
      series: seriesFilter ? [seriesFilter] : [],
      packs: packFilter ? [packFilter] : [],
    }),
    [typeFilter, rarityFilter, stageFilter, seriesFilter, packFilter]
  );

  const results = useMemo(() => {
    const searched = searchDeckBrowserCards(cards, query);
    const filtered = filterDeckBrowserCards(searched, filterState);
    const owned =
      isSignedIn && ownedOnly ? filtered.filter((card) => (quantities[card.id] ?? 0) > 0) : filtered;
    return sortDeckBrowserCards(owned, sortCriterion, sortDirection, lang);
  }, [cards, query, filterState, ownedOnly, isSignedIn, quantities, sortCriterion, sortDirection, lang]);

  const visible = results.slice(0, MAX_VISIBLE);
  const truncated = results.length > MAX_VISIBLE;

  function countOf(id: string): number {
    return countCardInDeck(value, id);
  }

  function addOne(id: string) {
    onChange(addCardToDeck(value, id, max, maxPerCard));
  }

  function removeOne(id: string) {
    onChange(removeCardFromDeck(value, id));
  }

  function handleSortChange(criterion: SortCriterion) {
    setSortCriterion(criterion);
    setSortDirection(getDefaultDirection(criterion));
  }

  if (!open) return null;

  return (
    <div className="theme-reset-light fixed inset-0 z-[100] flex items-stretch justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-[#0B2D5B]/40" onClick={onClose} />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={t.title}
        className="relative flex h-[100dvh] w-full flex-col overflow-hidden bg-surface shadow-xl sm:h-[85vh] sm:max-w-5xl sm:rounded-2xl sm:border sm:border-line"
      >
        {/* ヘッダー: タイトル・現在のデッキ枚数・閉じるボタン。
            フルスクリーン表示(h-[100dvh])のため、iOSのノッチ/ステータスバーに重ならないよう
            safe-area-inset-topぶんの余白を足す(SiteHeader.tsxと同じ方式) */}
        <div className="flex shrink-0 items-center justify-between border-b border-line px-4 py-3 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
          <p className="text-sm font-semibold text-foreground">{t.title}</p>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-accent px-3 py-1 text-xs font-bold text-white">
              {t.deckCount(String(value.length), String(max))}
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label={t.done}
              className="cursor-pointer rounded-full p-1 text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* 検索・絞り込み・並び替え。モバイルでも横スクロールのchip列ではなく、
            折り返す小さいセレクトを並べることで「延々スクロールする」UIを避けている */}
        <div className="shrink-0 space-y-2 border-b border-line px-4 py-3">
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full rounded-lg border border-line bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
          />
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              className={SELECT_CLASS}
            >
              <option value="">{t.typeAll}</option>
              {typeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <select
              value={rarityFilter}
              onChange={(event) => setRarityFilter(event.target.value)}
              className={SELECT_CLASS}
            >
              <option value="">{t.rarityAll}</option>
              {rarityOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <select
              value={stageFilter}
              onChange={(event) => setStageFilter(event.target.value)}
              className={SELECT_CLASS}
            >
              <option value="">{t.stageAll}</option>
              {stageOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <select
              value={seriesFilter}
              onChange={(event) => handleSeriesChange(event.target.value)}
              className={SELECT_CLASS}
            >
              <option value="">{t.seriesAll}</option>
              {seriesOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {/* パックはシリーズを選んだ時だけ、かつそのシリーズに複数パックがある時だけ表示する
                (パックが1種類しかないシリーズでは、シリーズ選択自体が実質そのパック指定と同じ意味になるため) */}
            {packOptionsForSelectedSeries.length > 0 && (
              <select
                value={packFilter}
                onChange={(event) => setPackFilter(event.target.value)}
                className={SELECT_CLASS}
              >
                <option value="">{t.packAll}</option>
                {packOptionsForSelectedSeries.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            )}

            <div className="ml-auto flex items-center gap-1">
              <select
                value={sortCriterion}
                onChange={(event) => handleSortChange(event.target.value as SortCriterion)}
                aria-label={t.sortLabel}
                className={SELECT_CLASS}
              >
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setSortDirection((d) => (d === "asc" ? "desc" : "asc"))}
                aria-label={t.sortLabel}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-line text-foreground transition-colors hover:border-accent/40"
              >
                <ArrowUpDown className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {isSignedIn && (
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={ownedOnly}
                onChange={(event) => setOwnedOnly(event.target.checked)}
                className="h-4 w-4 rounded border-line accent-accent"
              />
              {t.ownedOnly}
            </label>
          )}
        </div>

        {/* カード画像グリッド */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {visible.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted">{t.noResults}</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {visible.map((card) => (
                <DeckCardBrowserTile
                  key={card.id}
                  card={card}
                  lang={lang}
                  count={countOf(card.id)}
                  maxPerCard={maxPerCard}
                  ownedQuantity={isSignedIn ? (quantities[card.id] ?? 0) : null}
                  onAdd={() => addOne(card.id)}
                  onRemove={() => removeOne(card.id)}
                />
              ))}
            </div>
          )}
          {truncated && (
            <p className="mt-4 text-center text-xs text-muted">
              {t.moreResults(String(visible.length), String(results.length))}
            </p>
          )}
        </div>

        <div className="shrink-0 border-t border-line px-4 py-3 text-right">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-accent-strong"
          >
            {t.done}
          </button>
        </div>
      </div>
    </div>
  );
}
