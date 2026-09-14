import { getAllCards } from "@/lib/data";
import { searchCards } from "@/lib/search";
import { filterCards, parseFilterState } from "@/lib/filter";
import { sortCards, parseSortCriterion, parseSortDirection, getDefaultDirection } from "@/lib/sort";
import { CardGrid } from "@/components/CardGrid";
import { Pager } from "@/components/Pager";
import { SearchBar } from "@/components/SearchBar";
import { FilterPanel } from "@/components/FilterPanel";
import { SortSelect } from "@/components/SortSelect";
import { Container } from "@/components/Container";
import { getLang } from "@/lib/i18n/lang";
import { getDict } from "@/lib/i18n/dict";

// 1ページに表示するカード枚数。3,879枚を一度に全部出すと重いため、ページ分けする。
const PAGE_SIZE = 60;

export default async function CardsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const lang = await getLang();
  const t = getDict(lang).cards;
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q : "";
  const filters = parseFilterState(params);
  const sortCriterion = parseSortCriterion(params.sort);
  const sortDirection = params.dir ? parseSortDirection(params.dir) : getDefaultDirection(sortCriterion);

  const allCards = getAllCards();
  const searchedCards = searchCards(allCards, query);
  const filteredCards = filterCards(searchedCards, filters);
  const sortedCards = sortCards(filteredCards, sortCriterion, sortDirection, lang);

  const totalPages = Math.max(1, Math.ceil(sortedCards.length / PAGE_SIZE));
  const requestedPage = Number(params.page) || 1;
  const currentPage = Math.min(Math.max(1, requestedPage), totalPages);

  const start = (currentPage - 1) * PAGE_SIZE;
  const pageCards = sortedCards.slice(start, start + PAGE_SIZE);

  return (
    <main>
      <div className="hero-dark border-b border-line bg-hero-gradient-dark">
        <Container className="py-8 sm:py-10">
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">{t.title}</h1>

          {/*
            検索キーワード・絞り込み条件・並び替えを、1つのフォームとしてまとめて送信する。
            key={検索条件の文字列}を付けているのは、条件が変わった時に中の入力欄
            (検索ボックス・チェックボックス・並び替え)を作り直させるため。
            これが無いと、ページ遷移後も見た目が古いままになることがある。
          */}
          <form
            key={JSON.stringify(params)}
            action="/cards"
            method="GET"
            className="mt-4 space-y-3"
          >
            <SearchBar defaultValue={query} lang={lang} />
            <FilterPanel filters={filters} lang={lang} />

            <div className="flex items-center justify-between pt-1">
              <p className="text-sm text-muted">
                {query || filteredCards.length !== allCards.length
                  ? t.resultCount(filteredCards.length.toLocaleString())
                  : t.allCount(allCards.length.toLocaleString())}
              </p>
              <SortSelect criterion={sortCriterion} direction={sortDirection} />
            </div>
          </form>
        </Container>
      </div>

      <Container className="py-8 sm:py-10">
        <CardGrid cards={pageCards} lang={lang} />
        <Pager currentPage={currentPage} totalPages={totalPages} searchParams={params} lang={lang} />
      </Container>
    </main>
  );
}
