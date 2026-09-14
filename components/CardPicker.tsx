"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Plus, X, type LucideIcon } from "lucide-react";
import type { CardOption } from "@/lib/trade";
import { parseRarityFilterValue, type Option } from "@/lib/filterOptions";
import { TypeIcon } from "@/components/TypeIcon";
import { RarityIcon } from "@/components/RarityIcon";
import { IconFilterSelect } from "@/components/IconFilterSelect";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { getDict } from "@/lib/i18n/dict";

const MAX_RESULTS = 40;

/**
 * カード名で検索・タイプ/レアリティで絞り込みながら、複数枚選べる入力欄。
 * 3,879件を一気に表示するのは重いため、条件に合った上位件数だけ表示する。
 */
export function CardPicker({
  label,
  hint,
  icon: Icon,
  accentGradient = "from-accent to-accent-strong",
  cards,
  typeOptions,
  rarityOptions,
  value,
  onChange,
  max,
}: {
  label: string;
  hint?: string;
  /** ラベル横・追加ボタンの色分けに使うアイコンとグラデーション(例: "from-violet-500 to-indigo-500") */
  icon?: LucideIcon;
  accentGradient?: string;
  cards: CardOption[];
  typeOptions: Option[];
  rarityOptions: Option[];
  value: string[];
  onChange: (ids: string[]) => void;
  max: number;
}) {
  const lang = useLang();
  const t = getDict(lang).trade.cardPicker;
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [rarityFilter, setRarityFilter] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const cardMap = useMemo(() => new Map(cards.map((card) => [card.id, card])), [cards]);
  const selectedCards = value.map((id) => cardMap.get(id)).filter((c): c is CardOption => Boolean(c));
  const isFull = value.length >= max;

  const results = useMemo(() => {
    const keyword = query.trim();
    const rarityQuery = rarityFilter ? parseRarityFilterValue(rarityFilter) : null;
    return cards
      .filter((card) => !keyword || card.name.includes(keyword))
      .filter((card) => !typeFilter || card.type === typeFilter)
      .filter(
        (card) =>
          !rarityQuery || (card.rarity === rarityQuery.rarity && card.shiny === rarityQuery.shiny)
      )
      .slice(0, MAX_RESULTS);
  }, [cards, query, typeFilter, rarityFilter]);

  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  function toggleCard(id: string) {
    if (value.includes(id)) {
      onChange(value.filter((v) => v !== id));
      return;
    }
    if (value.length >= max) return;
    onChange([...value, id]);
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="mb-1 flex items-center gap-2">
        {Icon && (
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white ${accentGradient}`}
          >
            <Icon className="h-4 w-4" />
          </span>
        )}
        <label className="text-sm font-semibold text-foreground">{label}</label>
        <span className="ml-auto flex items-center gap-2 text-xs text-muted">
          {t.cardCount(String(value.length), String(max))}
          {value.length > 0 && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="rounded-full bg-red-500 px-2 py-0.5 text-[11px] font-semibold text-white transition-colors hover:bg-red-600"
            >
              {t.clear}
            </button>
          )}
        </span>
      </div>
      {hint && value.length === 0 && <p className="mb-1 text-xs text-muted">{hint}</p>}

      {value.length === 0 ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line bg-surface px-4 py-10 text-muted transition-colors duration-150 hover:border-accent/40 hover:bg-surface-hover"
        >
          <span
            className={`flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br text-white shadow-md ${accentGradient}`}
          >
            <Plus className="h-6 w-6" />
          </span>
          <span className="text-sm font-semibold text-foreground">{t.addCard}</span>
          <span className="text-xs">{t.maxCards(String(max))}</span>
        </button>
      ) : (
        // 横5枚×縦2枚(最大10枚)で並ぶよう5列固定のグリッドにしている。
        // 選択済みカードは実物に近い縦長サムネイルで見せ、追加枠は空いている分だけ
        // グリッドの続きに現れる(枚数が少ない時に2行分を無理に埋めたりはしない)。
        <div className="grid grid-cols-5 gap-2 rounded-xl border border-line bg-surface p-2">
          {selectedCards.map((card) => (
            <div
              key={card.id}
              className="group relative aspect-[245/342] overflow-hidden rounded-lg border border-line bg-background"
            >
              <Image src={card.image} alt={card.name} fill sizes="120px" className="object-contain" />
              <button
                type="button"
                onClick={() => toggleCard(card.id)}
                aria-label={t.removeCard(card.name)}
                className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-red-500"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          {!isFull && (
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              aria-label={t.addCard}
              className="flex aspect-[245/342] items-center justify-center rounded-lg border-2 border-dashed border-line text-muted transition-colors duration-150 hover:border-accent/40 hover:bg-surface-hover"
            >
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br text-white ${accentGradient}`}
              >
                <Plus className="h-4 w-4" />
              </span>
            </button>
          )}
        </div>
      )}

      {isOpen && (
        <div className="absolute z-20 mt-1 w-full rounded-xl border border-line bg-surface shadow-lg">
          {/* パネル全体を閉じるボタン。「この枠ごと消える」ことが伝わるよう、右上の角に食い込ませて目立たせている */}
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            aria-label={t.close}
            className="absolute -top-2 -right-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow-md transition-colors hover:bg-red-600"
          >
            <X className="h-3.5 w-3.5" />
          </button>

          <div className="space-y-2 border-b border-line p-3">
            <div className="relative">
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t.searchPlaceholder}
                className="w-full rounded-lg border border-line bg-background px-3 py-1.5 pr-8 text-sm text-foreground focus:border-accent/60 focus:outline-none"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label={t.clearSearch}
                  className="absolute top-1/2 right-2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <IconFilterSelect
                value={typeFilter}
                onChange={setTypeFilter}
                allLabel={t.typeAll}
                options={typeOptions}
                renderIcon={(v) => <TypeIcon type={v} className="h-4 w-4" />}
              />
              <IconFilterSelect
                value={rarityFilter}
                onChange={setRarityFilter}
                allLabel={t.rarityAll}
                options={rarityOptions}
                renderIcon={(v) => {
                  const { rarity, shiny } = parseRarityFilterValue(v);
                  return <RarityIcon rarity={rarity} shiny={shiny} className="h-4" />;
                }}
              />
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto">
            {results.length === 0 && (
              <p className="px-3 py-3 text-sm text-muted">{t.noResults}</p>
            )}
            {results.map((card) => {
              const isSelected = value.includes(card.id);
              const isDisabled = !isSelected && isFull;
              return (
                <button
                  key={card.id}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => toggleCard(card.id)}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-left transition-colors ${
                    isSelected ? "bg-accent/10" : "hover:bg-surface-hover"
                  } ${isDisabled ? "cursor-not-allowed opacity-40" : ""}`}
                >
                  <CardThumb card={card} />
                  <span className="truncate text-sm text-foreground">{card.name}</span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="w-full border-t border-line px-3 py-2 text-center text-xs text-muted hover:bg-surface-hover"
          >
            {t.close}
          </button>
        </div>
      )}
    </div>
  );
}

function CardThumb({ card }: { card: CardOption }) {
  return (
    <div className="relative h-12 w-9 shrink-0 overflow-hidden rounded bg-background">
      <Image src={card.image} alt={card.name} fill sizes="36px" className="object-contain" />
    </div>
  );
}
