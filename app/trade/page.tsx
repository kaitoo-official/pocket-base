import { TradeBoard } from "@/components/TradeBoard";
import { RarityIcon } from "@/components/RarityIcon";
import { Container } from "@/components/Container";
import {
  getTradableCardOptions,
  getTradableTypeOptions,
  getTradableRarityOptions,
} from "@/lib/trade";
import { getLang } from "@/lib/i18n/lang";
import { getDict } from "@/lib/i18n/dict";

export default async function TradePage() {
  const lang = await getLang();
  const t = getDict(lang).trade;
  const options = getTradableCardOptions(lang);

  return (
    <main>
      <div className="hero-dark border-b border-line bg-hero-gradient-dark">
        <Container className="py-12 sm:py-16">
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            {t.heroTitle}
          </h1>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted">
            {t.heroDescription1}
            <br />
            {t.heroDescription2}
          </p>
          <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
            <span>※</span>
            <span className="inline-flex items-center gap-1">
              <RarityIcon rarity="◊" className="h-4" />
              1〜4
            </span>
            <span className="text-line-strong">｜</span>
            <span className="inline-flex items-center gap-1">
              <RarityIcon rarity="☆" className="h-4" />
              1〜2
            </span>
            <span className="text-line-strong">｜</span>
            <span className="inline-flex items-center gap-1">
              <RarityIcon rarity="☆" shiny className="h-4" />
              1〜2
            </span>
            <span>{t.rarityNoteSuffix}</span>
          </p>
        </Container>
      </div>

      <div className="relative overflow-hidden bg-trade-gradient">
        <Container className="relative py-10">
          <TradeBoard
            cards={options}
            typeOptions={getTradableTypeOptions(options, lang)}
            rarityOptions={getTradableRarityOptions(options, lang)}
          />
        </Container>
      </div>
    </main>
  );
}
