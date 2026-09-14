import { SearchX } from "lucide-react";
import type { Card } from "@/types/card";
import { CardTile } from "@/components/CardTile";
import { EmptyState } from "@/components/EmptyState";
import type { Lang } from "@/lib/i18n/lang";

/**
 * カードを並べるグリッド。スマホは2列、PCは最大6列まで広がる。
 */
export function CardGrid({ cards, lang = "ja" }: { cards: Card[]; lang?: Lang }) {
  if (cards.length === 0) {
    return (
      <EmptyState
        icon={SearchX}
        title={lang === "en" ? "No matching cards found" : "該当するカードが見つかりませんでした"}
        description={
          lang === "en"
            ? "Try different keywords or filter conditions."
            : "検索キーワードや絞り込み条件を変えてお試しください。"
        }
      />
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {cards.map((card) => (
        <CardTile key={card.id} card={card} lang={lang} />
      ))}
    </div>
  );
}
