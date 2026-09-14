import type { ReactNode } from "react";
import { ClearFiltersButton } from "@/components/ClearFiltersButton";
import { FilterDrawer } from "@/components/FilterDrawer";
import { GroupTabs } from "@/components/GroupTabs";
import { TypeIcon } from "@/components/TypeIcon";
import { RarityIcon } from "@/components/RarityIcon";
import type { FilterState } from "@/lib/filter";
import { countActiveFilters } from "@/lib/filter";
import { getRarityLabel } from "@/lib/rarityLabels";
import type { Lang } from "@/lib/i18n/lang";
import { getDict } from "@/lib/i18n/dict";
import {
  getAbilityOptions,
  getAcquisitionOptions,
  getCardFlagOptions,
  getCategoryOptions,
  getExpansionPackGroups,
  getRarityOptions,
  getRetreatCostOptions,
  getStageOptions,
  getTypeOptions,
  parseRarityFilterValue,
  type Option,
} from "@/lib/filterOptions";

function FilterSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold text-muted">{title}</p>
      {children}
    </div>
  );
}

const CHIP_BASE =
  "cursor-pointer rounded-full border border-line px-3 py-1 text-xs text-foreground transition-colors hover:border-line-strong hover:bg-surface-hover has-[:checked]:border-accent has-[:checked]:bg-accent has-[:checked]:text-background has-[:checked]:hover:bg-accent-strong";

// タイプチップだけは、絵柄アイコンを大きめに見せたいので少し縦に余裕を持たせる
const TYPE_CHIP_BASE =
  "cursor-pointer rounded-full border border-line py-1.5 pr-3.5 pl-1.5 text-xs text-foreground transition-colors hover:border-line-strong hover:bg-surface-hover has-[:checked]:border-accent has-[:checked]:bg-accent has-[:checked]:text-background has-[:checked]:hover:bg-accent-strong";

function CheckboxChips({
  name,
  options,
  selected,
}: {
  name: string;
  options: Option[];
  selected: string[];
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <label key={opt.value} className={CHIP_BASE}>
          <input
            type="checkbox"
            name={name}
            value={opt.value}
            defaultChecked={selected.includes(opt.value)}
            className="sr-only"
          />
          {opt.label}
        </label>
      ))}
    </div>
  );
}

/** 「タイプ」専用。ラベルの前に絵柄アイコンを添える */
function TypeCheckboxChips({
  name,
  options,
  selected,
}: {
  name: string;
  options: Option[];
  selected: string[];
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <label key={opt.value} className={TYPE_CHIP_BASE}>
          <input
            type="checkbox"
            name={name}
            value={opt.value}
            defaultChecked={selected.includes(opt.value)}
            className="sr-only"
          />
          <span className="inline-flex items-center gap-1.5">
            <TypeIcon type={opt.value} className="h-6 w-6" />
            {opt.label}
          </span>
        </label>
      ))}
    </div>
  );
}

/** 「レアリティ」専用。ラベルの前にバッジ画像を添える */
function RarityCheckboxChips({
  name,
  options,
  selected,
  lang,
}: {
  name: string;
  options: Option[];
  selected: string[];
  lang: Lang;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const { rarity, shiny } = parseRarityFilterValue(opt.value);
        return (
          <label key={opt.value} className={TYPE_CHIP_BASE}>
            <input
              type="checkbox"
              name={name}
              value={opt.value}
              defaultChecked={selected.includes(opt.value)}
              className="sr-only"
            />
            <span className="inline-flex items-center gap-1.5">
              <RarityIcon rarity={rarity} shiny={shiny} className="h-6" />
              {getRarityLabel(rarity, shiny, lang)}
            </span>
          </label>
        );
      })}
    </div>
  );
}

function RadioChips({
  name,
  options,
  selected,
  allLabel,
}: {
  name: string;
  options: Option[];
  selected?: string;
  allLabel: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <label className={CHIP_BASE}>
        <input
          type="radio"
          name={name}
          value=""
          defaultChecked={!selected}
          className="sr-only"
        />
        {allLabel}
      </label>
      {options.map((opt) => (
        <label key={opt.value} className={CHIP_BASE}>
          <input
            type="radio"
            name={name}
            value={opt.value}
            defaultChecked={selected === opt.value}
            className="sr-only"
          />
          {opt.label}
        </label>
      ))}
    </div>
  );
}

/**
 * 絞り込みパネル。ボタンを押すと画面下からシートがせり上がる(FilterDrawer)。
 * 中の<input>は、page.tsx側が持つ1つの<form>の一部として送信される
 * (検索キーワードと絞り込み条件を同時に送るため、あえてこのファイルには<form>を作らない)。
 */
export function FilterPanel({ filters, lang = "ja" }: { filters: FilterState; lang?: Lang }) {
  const activeCount = countActiveFilters(filters);
  const t = getDict(lang).filters;

  return (
    <FilterDrawer activeCount={activeCount}>
      <div className="space-y-5">
        <FilterSection title={t.category}>
          <RadioChips
            name="category"
            options={getCategoryOptions(lang)}
            selected={filters.category}
            allLabel={t.all}
          />
        </FilterSection>

        <FilterSection title={t.type}>
          <TypeCheckboxChips name="type" options={getTypeOptions(lang)} selected={filters.types} />
        </FilterSection>

        <FilterSection title={t.stage}>
          <CheckboxChips name="stage" options={getStageOptions(lang)} selected={filters.stages} />
        </FilterSection>

        <FilterSection title={t.rarity}>
          <RarityCheckboxChips
            name="rarity"
            options={getRarityOptions(lang)}
            selected={filters.rarities}
            lang={lang}
          />
        </FilterSection>

        <FilterSection title={t.hp}>
          <div className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="number"
              name="hpMin"
              defaultValue={filters.hpMin ?? ""}
              placeholder={t.min}
              className="w-24 rounded-md border border-line bg-surface px-2 py-1 text-foreground"
            />
            <span className="text-muted">〜</span>
            <input
              type="number"
              name="hpMax"
              defaultValue={filters.hpMax ?? ""}
              placeholder={t.max}
              className="w-24 rounded-md border border-line bg-surface px-2 py-1 text-foreground"
            />
          </div>
        </FilterSection>

        <FilterSection title={t.moveDamage}>
          <div className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="number"
              name="damageMin"
              defaultValue={filters.damageMin ?? ""}
              placeholder={t.min}
              className="w-24 rounded-md border border-line bg-surface px-2 py-1 text-foreground"
            />
            <span className="text-muted">〜</span>
            <input
              type="number"
              name="damageMax"
              defaultValue={filters.damageMax ?? ""}
              placeholder={t.max}
              className="w-24 rounded-md border border-line bg-surface px-2 py-1 text-foreground"
            />
          </div>
        </FilterSection>

        <FilterSection title={t.retreatCost}>
          <CheckboxChips
            name="retreatCost"
            options={getRetreatCostOptions()}
            selected={filters.retreatCosts}
          />
        </FilterSection>

        <FilterSection title={t.other}>
          <div className="space-y-2">
            <RadioChips
              name="ability"
              options={getAbilityOptions(lang)}
              selected={filters.ability}
              allLabel={t.all}
            />
            <CheckboxChips
              name="cardFlag"
              options={getCardFlagOptions(lang)}
              selected={filters.cardFlags}
            />
          </div>
        </FilterSection>

        <FilterSection title={t.acquisition}>
          <RadioChips
            name="acquisition"
            options={getAcquisitionOptions(lang)}
            selected={filters.acquisition}
            allLabel={t.all}
          />
        </FilterSection>

        <FilterSection title={t.expansion}>
          <GroupTabs
            groups={getExpansionPackGroups(lang).map((group) => ({
              label: group.groupLabel,
              content: (
                <div className="space-y-3">
                  {group.series.map((entry) => (
                    <div key={entry.seriesId}>
                      <p className="mb-1 text-xs font-semibold text-foreground">
                        {entry.seriesName}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <label className={CHIP_BASE}>
                          <input
                            type="checkbox"
                            name="series"
                            value={entry.seriesId}
                            defaultChecked={filters.series.includes(entry.seriesId)}
                            className="sr-only"
                          />
                          {t.all}
                        </label>
                        {entry.packs.map((pack) => (
                          <label key={pack.value} className={CHIP_BASE}>
                            <input
                              type="checkbox"
                              name="pack"
                              value={pack.value}
                              defaultChecked={filters.packs.includes(pack.value)}
                              className="sr-only"
                            />
                            {pack.label}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ),
            }))}
          />
        </FilterSection>
      </div>

      <div className="sticky bottom-0 z-10 -mx-4 mt-5 flex gap-3 border-t border-line bg-white px-4 pt-3 pb-3 shadow-[0_-6px_12px_-4px_rgba(15,23,42,0.15)]">
        <button
          type="submit"
          className="cursor-pointer rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-background transition-colors hover:bg-accent-strong"
        >
          {t.apply}
        </button>
        <ClearFiltersButton />
      </div>
    </FilterDrawer>
  );
}
