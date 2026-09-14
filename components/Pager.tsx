import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Lang } from "@/lib/i18n/lang";

type SearchParams = Record<string, string | string[] | undefined>;

interface PagerProps {
  currentPage: number;
  totalPages: number;
  /** 現在のURLの検索条件(?q=...など)。ページ番号だけ差し替えて他の条件は維持する */
  searchParams: SearchParams;
  /** ページ送り先のパス。省略時は/cards */
  basePath?: string;
  lang?: Lang;
}

function buildHref(basePath: string, page: number, searchParams: SearchParams) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (key === "page" || value == null) continue;
    if (Array.isArray(value)) {
      value.forEach((v) => params.append(key, v));
    } else {
      params.set(key, value);
    }
  }
  params.set("page", String(page));
  return `${basePath}?${params.toString()}`;
}

/** ページ番号以外の現在の検索条件を、<form>の中で維持するための隠しinput群 */
function CarriedParams({ searchParams }: { searchParams: SearchParams }) {
  const entries: { key: string; value: string }[] = [];
  for (const [key, value] of Object.entries(searchParams)) {
    if (key === "page" || value == null) continue;
    if (Array.isArray(value)) {
      value.forEach((v) => entries.push({ key, value: v }));
    } else {
      entries.push({ key, value });
    }
  }
  return (
    <>
      {entries.map((entry, i) => (
        <input key={i} type="hidden" name={entry.key} value={entry.value} />
      ))}
    </>
  );
}

export function Pager({
  currentPage,
  totalPages,
  searchParams,
  basePath = "/cards",
  lang = "ja",
}: PagerProps) {
  if (totalPages <= 1) return null;

  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;
  const prevLabel = lang === "en" ? "Prev" : "前へ";
  const nextLabel = lang === "en" ? "Next" : "次へ";

  return (
    <nav className="flex flex-wrap items-center justify-center gap-4 py-10 text-sm">
      {hasPrev ? (
        <Link
          href={buildHref(basePath, currentPage - 1, searchParams)}
          className="flex items-center gap-1 rounded-lg border border-line bg-surface px-3 py-2 text-foreground shadow-xs transition-colors duration-150 hover:border-accent/40 hover:bg-surface-hover"
        >
          <ChevronLeft className="h-4 w-4" />
          {prevLabel}
        </Link>
      ) : (
        <span className="flex items-center gap-1 rounded-lg border border-line px-3 py-2 text-muted">
          <ChevronLeft className="h-4 w-4" />
          {prevLabel}
        </span>
      )}

      <span className="font-[family-name:var(--font-inter)] font-medium text-muted">
        {currentPage} / {totalPages}
      </span>

      {hasNext ? (
        <Link
          href={buildHref(basePath, currentPage + 1, searchParams)}
          className="flex items-center gap-1 rounded-lg border border-line bg-surface px-3 py-2 text-foreground shadow-xs transition-colors duration-150 hover:border-accent/40 hover:bg-surface-hover"
        >
          {nextLabel}
          <ChevronRight className="h-4 w-4" />
        </Link>
      ) : (
        <span className="flex items-center gap-1 rounded-lg border border-line px-3 py-2 text-muted">
          {nextLabel}
          <ChevronRight className="h-4 w-4" />
        </span>
      )}

      {/*
        key={currentPage}を付けているのは、ページ移動後も入力欄の初期値が
        古いページ番号のまま表示され続けるのを防ぐため(チェックボックスの時と同じ理由)。
      */}
      <form
        key={currentPage}
        action={basePath}
        method="GET"
        className="flex items-center gap-1.5"
      >
        <CarriedParams searchParams={searchParams} />
        <span className="text-muted">{lang === "en" ? "Go to page:" : "ページ指定:"}</span>
        <input
          type="number"
          name="page"
          min={1}
          max={totalPages}
          defaultValue={currentPage}
          className="w-16 rounded-lg border border-line bg-surface px-2 py-1.5 text-center text-foreground focus:border-accent/60 focus:outline-none"
        />
        <button
          type="submit"
          className="cursor-pointer rounded-lg border border-line bg-surface px-3 py-1.5 text-xs text-foreground shadow-xs transition-colors duration-150 hover:border-accent/40 hover:bg-surface-hover"
        >
          {lang === "en" ? "Go" : "移動"}
        </button>
      </form>
    </nav>
  );
}
