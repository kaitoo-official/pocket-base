import { getAllExpansions, getCardsForPack } from "@/lib/data";
import { PackTile } from "@/components/PackTile";
import { Container } from "@/components/Container";
import { PackSortSelect, type PackSortDirection } from "@/components/PackSortSelect";
import { getJapaneseSeriesName } from "@/lib/nameJa";
import { getLang } from "@/lib/i18n/lang";
import { getDict } from "@/lib/i18n/dict";

export default async function PacksPage({
  searchParams,
}: {
  searchParams: Promise<{ dir?: string }>;
}) {
  const lang = await getLang();
  const t = getDict(lang).packs;
  const { dir } = await searchParams;
  const direction: PackSortDirection = dir === "desc" ? "desc" : "asc";

  // プロモ(pa/pb)は購入できる通常パックではないため、パック一覧には出さない
  const expansions = getAllExpansions()
    .filter((exp) => exp.releaseDate)
    .sort((a, b) => {
      const aDate = a.releaseDate as string;
      const bDate = b.releaseDate as string;
      return direction === "desc" ? bDate.localeCompare(aDate) : aDate.localeCompare(bDate);
    });

  return (
    <main>
      <div className="hero-dark border-b border-line bg-hero-gradient-dark">
        <Container className="py-8 sm:py-10">
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">{t.title}</h1>
          <div className="mt-1 flex items-center justify-between">
            <p className="text-sm text-muted">{t.seriesCount(expansions.length.toLocaleString())}</p>
            <form action="/packs" method="GET">
              <PackSortSelect direction={direction} />
            </form>
          </div>
        </Container>
      </div>

      <Container className="py-8 sm:py-10">
        <div className="space-y-14">
          {expansions.map((expansion) => (
            <section key={expansion.id} id={expansion.id} className="scroll-mt-24">
              <div className="flex items-baseline justify-between">
                <h2 className="text-base font-bold text-foreground">
                  {getJapaneseSeriesName(expansion.id, expansion.name, lang)}
                </h2>
                <p className="text-xs text-muted">
                  {expansion.releaseDate ?? t.releaseDateUnknown} · {t.cardCount(expansion.totalCards.toLocaleString())}
                </p>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {expansion.packs.map((pack) => (
                  <PackTile
                    key={pack.id}
                    pack={pack}
                    expansion={expansion}
                    cardCount={getCardsForPack(expansion, pack).length}
                    lang={lang}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      </Container>
    </main>
  );
}
