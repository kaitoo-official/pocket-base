"use client";

import { RotateCcw, Search, X } from "lucide-react";
import { IconFilterSelect } from "@/components/IconFilterSelect";
import { TypeIcon } from "@/components/TypeIcon";
import { RarityIcon } from "@/components/RarityIcon";
import { parseRarityFilterValue, type Option } from "@/lib/filterOptions";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { getDict } from "@/lib/i18n/dict";

/**
 * トレード投稿一覧の検索・絞り込みバー。
 * カードデータベース(SearchBar)と同じ、検索欄単体の見た目に揃えている。
 * タイプ/レアリティはその下に、まとめ枠を作らず横並びで直接置く。
 */
export function TradePostSearch({
  query,
  onQueryChange,
  typeFilter,
  onTypeFilterChange,
  rarityFilter,
  onRarityFilterChange,
  typeOptions,
  rarityOptions,
  onReset,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  typeFilter: string;
  onTypeFilterChange: (value: string) => void;
  rarityFilter: string;
  onRarityFilterChange: (value: string) => void;
  typeOptions: Option[];
  rarityOptions: Option[];
  onReset: () => void;
}) {
  const lang = useLang();
  const t = getDict(lang).trade.search;

  return (
    <div>
      <div className="flex items-center gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-line bg-surface p-2 shadow-xs transition-colors focus-within:border-accent/50">
          <Search className="ml-2 h-5 w-5 shrink-0 text-muted" />
          <input
            type="text"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={t.placeholder}
            className="h-11 w-full bg-transparent text-sm text-foreground placeholder:text-muted focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => onQueryChange("")}
              aria-label={t.clearSearch}
              className="mr-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex h-11 shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border border-line bg-surface px-3.5 text-sm text-muted transition-colors hover:bg-surface-hover"
        >
          <RotateCcw className="h-4 w-4" />
          {t.reset}
        </button>
      </div>

      <div className="mt-3 flex gap-2">
        <IconFilterSelect
          value={typeFilter}
          onChange={onTypeFilterChange}
          allLabel={t.typeAll}
          options={typeOptions}
          renderIcon={(v) => <TypeIcon type={v} className="h-4 w-4" />}
        />
        <IconFilterSelect
          value={rarityFilter}
          onChange={onRarityFilterChange}
          allLabel={t.rarityAll}
          options={rarityOptions}
          renderIcon={(v) => {
            const { rarity, shiny } = parseRarityFilterValue(v);
            return <RarityIcon rarity={rarity} shiny={shiny} className="h-4" />;
          }}
        />
      </div>
    </div>
  );
}
