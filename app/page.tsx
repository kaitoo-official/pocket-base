import Link from "next/link";
import { ArrowLeftRight, ArrowRight, LayoutGrid, PlayingCardsFan } from "lucide-react";
import { getAllCards, getAllExpansions, getCardsForPack } from "@/lib/data";
import { getTypeOptions, getRarityOptions, parseRarityFilterValue } from "@/lib/filterOptions";
import { getPackDisplayLabel, getJapaneseSeriesName } from "@/lib/nameJa";
import { getRarityLabel } from "@/lib/rarityLabels";
import { getTradePostCount, getLatestTradePosts, getTradableCardOptions } from "@/lib/trade";
import type { FeaturedPack } from "@/components/HeroVisual";
import { SearchBar } from "@/components/SearchBar";
import { PackTile } from "@/components/PackTile";
import { LatestPackCardMarquee } from "@/components/LatestPackCardMarquee";
import { TypeIcon } from "@/components/TypeIcon";
import { RarityIcon } from "@/components/RarityIcon";
import { Logo } from "@/components/Logo";
import { Container } from "@/components/Container";
import { SectionHeader } from "@/components/SectionHeader";
import { StatBadge } from "@/components/StatBadge";
import { HeroVisual } from "@/components/HeroVisual";
import { TradePostCard } from "@/components/TradePostCard";
import { FeaturedCardsSection } from "@/components/FeaturedCardsSection";
import { InfluencerVideosSection } from "@/components/InfluencerVideosSection";
import { getLang, type Lang } from "@/lib/i18n/lang";
import { getDict } from "@/lib/i18n/dict";

// トレード投稿数をFirestoreから毎回取得するため、このページはビルド時に固定せず
// リクエストのたびにレンダリングする(そうしないと件数が古いまま固定されてしまう)
export const dynamic = "force-dynamic";

// トレーナーズの分類(グッズ・サポート等)は「タイプ/属性」の探索としては趣旨が異なるため、
// Homeの「タイプから探す」ではポケモンのエネルギータイプのみを対象にする
const TRAINER_SUBTYPES = new Set(["Item", "ItemFossil", "Supporter", "Tool", "Stadium"]);

// 「最新パック」右側のカードプレビュー帯は、見栄えのする星2以上(色違いは除く)だけを対象にする
const PREVIEW_ELIGIBLE_RARITIES = new Set(["☆☆", "☆☆☆", "Crown Rare"]);

/** releaseDateを持つ拡張パックの中から、一番新しいものを1つ選ぶ */
function getLatestExpansion(expansions: ReturnType<typeof getAllExpansions>) {
  return expansions
    .filter((exp) => exp.releaseDate)
    .reduce<ReturnType<typeof getAllExpansions>[number] | undefined>((latest, exp) => {
      if (!latest || (exp.releaseDate as string) > (latest.releaseDate as string)) return exp;
      return latest;
    }, undefined);
}

/**
 * Hero右側で切り替え表示する「最近のパック」一覧。
 * 直近の拡張だけだとパックが1種類しか無いことが多いため、
 * 新しい順に複数の拡張からパックを集めてバリエーションを持たせる。
 * カード一覧・詳細ページでの表示に必要な情報(表示名・収録枚数)もここでまとめて計算しておく。
 */
function getFeaturedPacks(expansions: ReturnType<typeof getAllExpansions>, lang: Lang): FeaturedPack[] {
  return [...expansions]
    .filter((exp) => exp.releaseDate)
    .sort((a, b) => (b.releaseDate as string).localeCompare(a.releaseDate as string))
    .slice(0, 4)
    .flatMap((exp) =>
      exp.packs.map((pack) => ({
        pack,
        expansion: exp,
        label: getPackDisplayLabel(pack.name, exp.id, exp.name, lang),
        cardCount: getCardsForPack(exp, pack).length,
      }))
    )
    .slice(0, 6);
}

/** 配列からランダムにcount件選ぶ(Fisher-Yatesで先頭count件だけシャッフルすれば十分) */
function pickRandom<T>(items: T[], count: number): T[] {
  const pool = [...items];
  for (let i = 0; i < Math.min(count, pool.length - 1); i++) {
    const j = i + Math.floor(Math.random() * (pool.length - i));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}

export default async function HomePage() {
  const lang = await getLang();
  const t = getDict(lang).home;
  const allCards = getAllCards();
  const expansions = getAllExpansions();
  const latestExpansion = getLatestExpansion(expansions);
  const featuredPacks = getFeaturedPacks(expansions, lang);
  const latestPackPreviewCards = latestExpansion
    ? pickRandom(
        allCards.filter(
          (c) => c.setCode === latestExpansion.id && PREVIEW_ELIGIBLE_RARITIES.has(c.rarity) && !c.shiny
        ),
        6
      )
    : [];
  const elementalTypes = getTypeOptions(lang).filter((opt) => !TRAINER_SUBTYPES.has(opt.value));
  const rarityOptions = getRarityOptions(lang);

  // プロモ(発売日の無い拡張)を除いた、実際に購入できるパックの総数
  const purchasablePackCount = expansions
    .filter((exp) => exp.releaseDate)
    .reduce((sum, exp) => sum + exp.packs.length, 0);
  const tradePostCount = await getTradePostCount();
  const latestTradePosts = await getLatestTradePosts(3);
  const tradeCardMap = new Map(
    getTradableCardOptions(lang).map((card) => [card.id, card])
  );

  return (
    <main>
      {/* ===== Hero ===== */}
      <div className="hero-dark border-b border-line bg-hero-gradient-dark">
        <Container className="py-16 sm:py-20 lg:py-24">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="mx-auto max-w-2xl text-center lg:mx-0 lg:max-w-none lg:text-left">
              <Logo size="lg" withTagline />

              <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight text-foreground sm:text-5xl">
                {t.heroLine1}
                {/* 中央寄せになる中間幅(sm〜lg未満)は横幅に余裕があるので改行せず1行に。
                    モバイルは元々折り返しが必要、lg以上は2カラムに戻り見出しを2行で見せる元のデザインを維持する */}
                <br className="sm:hidden lg:inline" />
                <span className="relative inline-block">
                  <span className="relative z-10">{t.heroLine2}</span>
                  <span className="absolute inset-x-0 bottom-1 -z-0 h-3 rounded bg-accent-strong/20 sm:bottom-1.5 sm:h-4" />
                </span>
              </h1>
              <p className="mt-2 text-sm font-medium text-accent-strong">{t.tagline}</p>
              <p className="mt-3 text-sm leading-relaxed text-muted">{t.description}</p>

              <form action="/cards" method="GET" className="mt-8">
                <SearchBar lang={lang} />
              </form>

              <div className="mt-4 flex flex-wrap justify-center gap-3 lg:justify-start">
                <Link
                  href="/cards"
                  className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-white shadow-xs transition-colors duration-150 hover:bg-accent-strong"
                >
                  <LayoutGrid className="h-4 w-4" />
                  {t.browseCards}
                </Link>
                <Link
                  href="/packs"
                  className="inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-5 py-3 text-sm font-semibold text-foreground shadow-xs transition-colors duration-150 hover:border-accent/40 hover:bg-surface-hover"
                >
                  <PlayingCardsFan className="h-4 w-4 text-accent" />
                  {t.browsePacks}
                </Link>
              </div>

              <div className="mt-8 grid grid-cols-3 gap-3">
                <StatBadge
                  value={allCards.length.toLocaleString()}
                  label="CARDS"
                  subLabel={t.statCards}
                  href="/cards"
                />
                <StatBadge
                  value={purchasablePackCount.toLocaleString()}
                  label="PACKS"
                  subLabel={t.statPacks}
                  href="/packs"
                />
                <StatBadge
                  value={tradePostCount.toLocaleString()}
                  label="TRADES"
                  subLabel={t.statTrades}
                  href="/trade"
                />
              </div>
            </div>

            {featuredPacks.length > 0 && (
              <div className="mt-4 lg:mt-0">
                <HeroVisual packs={featuredPacks} />
              </div>
            )}
          </div>
        </Container>
      </div>

      <Container className="space-y-16 py-16 sm:space-y-20 sm:py-20">
        {/* ===== 最新パック ===== */}
        {latestExpansion && (
          <section id="latest-pack" className="scroll-mt-24">
            <SectionHeader
              title={`${t.latestPack}: ${getJapaneseSeriesName(latestExpansion.id, latestExpansion.name, lang)}`}
              href="/packs"
              linkLabel={t.viewAllPacks}
            />
            {/*
              パック枚数が少ない時に右側の帯だけが離れた位置に来てしまわないよう、
              グリッドではなくflex-wrapで「パック一覧の実際の幅」の直後に帯を続ける。
              帯側はflex-1で残りの余白を目いっぱい使い、入りきらない時だけ自然に折り返して次の行に落ちる。
            */}
            <div className="mt-5 flex flex-wrap items-start gap-6">
              <div className="flex shrink-0 flex-wrap gap-4">
                {latestExpansion.packs.map((pack) => (
                  <div key={pack.id} className="w-36 sm:w-40">
                    <PackTile
                      pack={pack}
                      expansion={latestExpansion}
                      cardCount={getCardsForPack(latestExpansion, pack).length}
                      lang={lang}
                    />
                  </div>
                ))}
              </div>
              <div className="w-full min-w-[280px] flex-1">
                <LatestPackCardMarquee cards={latestPackPreviewCards} lang={lang} />
              </div>
            </div>
          </section>
        )}

        {/* ===== タイプ・レアリティから探す ===== */}
        <section className="hero-dark rounded-2xl border border-line bg-hero-gradient-dark p-6 sm:p-8">
          <div>
            <SectionHeader title={t.exploreByType} />
            <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-10">
              {elementalTypes.map((type) => (
                <Link
                  key={type.value}
                  href={`/cards?type=${encodeURIComponent(type.value)}`}
                  className="flex flex-col items-center gap-2 rounded-xl border border-line bg-surface p-3 text-center shadow-xs transition duration-200 hover:-translate-y-1 hover:border-accent/40 hover:shadow-md"
                >
                  <TypeIcon type={type.value} className="h-9 w-9" />
                  <span className="text-xs font-medium text-foreground">{type.label}</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-8">
            <SectionHeader title={t.exploreByRarity} />
            <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-10">
              {rarityOptions.map((opt) => {
                const { rarity, shiny } = parseRarityFilterValue(opt.value);
                return (
                  <Link
                    key={opt.value}
                    href={`/cards?rarity=${encodeURIComponent(opt.value)}`}
                    className="flex flex-col items-center gap-2 rounded-xl border border-line bg-surface p-3 text-center shadow-xs transition duration-200 hover:-translate-y-1 hover:border-accent/40 hover:shadow-md"
                  >
                    <span className="flex h-9 w-full items-center justify-center">
                      <RarityIcon rarity={rarity} shiny={shiny} className="max-h-9 max-w-full" />
                    </span>
                    <span className="text-xs font-medium text-foreground">
                      {getRarityLabel(rarity, shiny, lang)}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* ===== 注目カード ===== */}
        <FeaturedCardsSection lang={lang} />

        {/* ===== インフルエンサー動画 ===== */}
        <InfluencerVideosSection lang={lang} />

        {/* ===== トレード掲示板 ===== */}
        <section>
          {latestTradePosts.length === 0 ? (
            <div className="rounded-2xl border border-line bg-surface p-8 text-center shadow-xs sm:p-10">
              <h2 className="text-lg font-bold text-foreground sm:text-xl">{t.tradeBoard}</h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted">{t.tradeBoardDescription}</p>
              <Link
                href="/trade"
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors duration-150 hover:bg-accent-strong"
              >
                <ArrowLeftRight className="h-4 w-4" />
                {t.viewBoard}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <>
              <SectionHeader title={t.tradeBoard} href="/trade" linkLabel={t.viewBoard} />
              <div className="mt-5 space-y-4">
                {latestTradePosts.map((post) => (
                  <TradePostCard key={post.id} post={post} cardMap={tradeCardMap} />
                ))}
              </div>
            </>
          )}
        </section>
      </Container>
    </main>
  );
}
