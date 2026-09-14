"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import { TradeComposer } from "@/components/TradeComposer";
import { TradePostCard } from "@/components/TradePostCard";
import { TradePostSearch } from "@/components/TradePostSearch";
import { TradePostSortSelect, type TradeSortOrder } from "@/components/TradePostSortSelect";
import { EmptyState } from "@/components/EmptyState";
import { subscribeToTradePosts, type CardOption, type TradePost } from "@/lib/trade";
import { parseRarityFilterValue, type Option } from "@/lib/filterOptions";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { getDict } from "@/lib/i18n/dict";

export function TradeBoard({
  cards,
  typeOptions,
  rarityOptions,
}: {
  cards: CardOption[];
  typeOptions: Option[];
  rarityOptions: Option[];
}) {
  const lang = useLang();
  const t = getDict(lang).trade;
  const cardMap = useMemo(() => new Map(cards.map((card) => [card.id, card])), [cards]);

  const [posts, setPosts] = useState<TradePost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [rarityFilter, setRarityFilter] = useState("");
  const [sortOrder, setSortOrder] = useState<TradeSortOrder>("new");

  function resetSearch() {
    setQuery("");
    setTypeFilter("");
    setRarityFilter("");
    setSortOrder("new");
  }

  useEffect(() => {
    const unsubscribe = subscribeToTradePosts((next) => {
      setPosts(next);
      setLoadingPosts(false);
    });
    return unsubscribe;
  }, []);

  const visiblePosts = useMemo(() => {
    const keyword = query.trim();
    const rarityQuery = rarityFilter ? parseRarityFilterValue(rarityFilter) : null;

    function postCards(post: TradePost): CardOption[] {
      return [...post.offerCardIds, ...post.wantCardIds]
        .map((id) => cardMap.get(id))
        .filter((c): c is CardOption => Boolean(c));
    }

    const filtered = posts.filter((post) => {
      const involvedCards = postCards(post);
      if (keyword && !involvedCards.some((card) => card.name.includes(keyword))) return false;
      if (typeFilter && !involvedCards.some((card) => card.type === typeFilter)) return false;
      if (
        rarityQuery &&
        !involvedCards.some((card) => card.rarity === rarityQuery.rarity && card.shiny === rarityQuery.shiny)
      )
        return false;
      return true;
    });

    return [...filtered].sort((a, b) => {
      if (sortOrder === "comments") {
        if (b.commentCount !== a.commentCount) return b.commentCount - a.commentCount;
      }
      const aTime = a.createdAt?.getTime() ?? 0;
      const bTime = b.createdAt?.getTime() ?? 0;
      return sortOrder === "old" ? aTime - bTime : bTime - aTime;
    });
  }, [posts, query, typeFilter, rarityFilter, sortOrder, cardMap]);

  return (
    <div>
      <TradeComposer cards={cards} typeOptions={typeOptions} rarityOptions={rarityOptions} />

      {/* カードデータベース(app/cards)の検索エリアと同じ、hero-darkのダーク背景に揃えている */}
      <div className="hero-dark mt-8 rounded-2xl border border-line bg-hero-gradient-dark p-6 sm:p-8">
        <h2 className="text-lg font-bold text-foreground">{t.board.postsListTitle}</h2>
        <div className="mt-3">
          <TradePostSearch
            query={query}
            onQueryChange={setQuery}
            typeFilter={typeFilter}
            onTypeFilterChange={setTypeFilter}
            rarityFilter={rarityFilter}
            onRarityFilterChange={setRarityFilter}
            typeOptions={typeOptions}
            rarityOptions={rarityOptions}
            onReset={resetSearch}
          />
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-muted">{t.board.postCount(visiblePosts.length.toLocaleString())}</p>
          <TradePostSortSelect value={sortOrder} onChange={setSortOrder} />
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {loadingPosts && <p className="text-sm text-muted">{t.board.loading}</p>}
        {!loadingPosts && posts.length === 0 && (
          <EmptyState
            icon={ArrowLeftRight}
            title={t.board.emptyTitle}
            description={t.board.emptyDescription}
          />
        )}
        {!loadingPosts && posts.length > 0 && visiblePosts.length === 0 && (
          <EmptyState
            icon={ArrowLeftRight}
            title={t.board.noMatchTitle}
            description={t.board.noMatchDescription}
          />
        )}
        {visiblePosts.map((post) => (
          <TradePostCard key={post.id} post={post} cardMap={cardMap} />
        ))}
      </div>
    </div>
  );
}
