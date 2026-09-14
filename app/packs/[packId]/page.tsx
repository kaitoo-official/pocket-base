import { notFound } from "next/navigation";
import { getPackById, getCardsForPack } from "@/lib/data";
import { getPackImageUrl } from "@/lib/getCardImage";
import { getPackDisplayLabel, getJapaneseSeriesName } from "@/lib/nameJa";
import { ImageWithFallback } from "@/components/ImageWithFallback";
import { CardGrid } from "@/components/CardGrid";
import { Pager } from "@/components/Pager";
import { BackLink } from "@/components/BackLink";
import { Container } from "@/components/Container";
import { getLang } from "@/lib/i18n/lang";
import { getDict } from "@/lib/i18n/dict";

const PAGE_SIZE = 60;

export default async function PackDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ packId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { packId } = await params;
  const found = getPackById(packId);

  if (!found) {
    notFound();
  }

  const lang = await getLang();
  const t = getDict(lang).packDetail;
  const { pack, expansion } = found;
  const cards = getCardsForPack(expansion, pack);
  const isOnlyPack = pack.name === "Booster";
  const label = getPackDisplayLabel(pack.name, expansion.id, expansion.name, lang);

  const query = await searchParams;
  const totalPages = Math.max(1, Math.ceil(cards.length / PAGE_SIZE));
  const requestedPage = Number(query.page) || 1;
  const currentPage = Math.min(Math.max(1, requestedPage), totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageCards = cards.slice(start, start + PAGE_SIZE);

  return (
    <Container as="main" className="py-8 sm:py-10">
      <BackLink href="/packs">{t.backToList}</BackLink>

      <div className="mt-4 flex items-center gap-4">
        <div className="relative aspect-[334/644] w-20 shrink-0 overflow-hidden rounded-lg bg-background sm:w-24">
          <ImageWithFallback
            src={getPackImageUrl(pack)}
            alt={label}
            sizes="96px"
            className="object-contain"
          />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">{label}</h1>
          {!isOnlyPack && (
            <p className="text-sm text-muted">{getJapaneseSeriesName(expansion.id, expansion.name, lang)}</p>
          )}
          <p className="text-sm text-muted">{t.cardCount(cards.length.toLocaleString())}</p>
        </div>
      </div>

      <div className="mt-6">
        <CardGrid cards={pageCards} lang={lang} />
      </div>

      <Pager
        currentPage={currentPage}
        totalPages={totalPages}
        searchParams={query}
        basePath={`/packs/${packId}`}
        lang={lang}
      />
    </Container>
  );
}
