import Link from "next/link";
import { notFound } from "next/navigation";
import { getCardById, getExpansionById } from "@/lib/data";
import { getCardImageUrl } from "@/lib/getCardImage";
import {
  getJapaneseName,
  getJapaneseSpeciesName,
  getJapaneseSeriesName,
  getJapaneseMoveName,
  getJapaneseMoveEffect,
  getJapaneseAbilityName,
  getJapaneseAbilityEffect,
} from "@/lib/nameJa";
import { getCategoryLabel, getStageLabel } from "@/lib/filterOptions";
import { TypeBadge } from "@/components/TypeBadge";
import { RarityBadge } from "@/components/RarityBadge";
import { ImageWithFallback } from "@/components/ImageWithFallback";
import { InfoRow } from "@/components/InfoRow";
import { AttackCostIcons, RetreatCostIcons, EnergyDot } from "@/components/EnergyIcons";
import { AcquisitionSection } from "@/components/AcquisitionSection";
import { PullRateSection } from "@/components/PullRateSection";
import { BackLink } from "@/components/BackLink";
import { getLang } from "@/lib/i18n/lang";
import { getDict } from "@/lib/i18n/dict";

export default async function CardDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const card = getCardById(id);

  if (!card) {
    notFound();
  }

  const lang = await getLang();
  const t = getDict(lang).cardDetail;

  const displayName = getJapaneseName(card, lang) ?? card.name;
  const hasJapaneseName = displayName !== card.name;
  const expansion = getExpansionById(card.setCode);
  const cardNumber = card.id.split("-")[1] ?? "";
  const totalInSet = expansion?.totalCards;

  return (
    <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      <BackLink href="/cards">{t.backToList}</BackLink>

      <div className="mt-4 grid gap-8 sm:grid-cols-2">
        <div className="relative mx-auto aspect-[245/342] w-full min-w-0 max-w-sm overflow-hidden rounded-xl bg-surface shadow-sm">
          <ImageWithFallback
            src={getCardImageUrl(card)}
            alt={displayName}
            sizes="(max-width: 640px) 90vw, 400px"
            className="object-contain"
          />
        </div>

        <div className="min-w-0">
          <p className="text-xs text-muted">
            No. {cardNumber}
            {totalInSet ? ` / ${totalInSet}` : ""}
          </p>
          <h1 className="mt-1 text-2xl font-bold text-foreground">{displayName}</h1>
          {hasJapaneseName && <p className="text-sm text-muted">{card.name}</p>}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <TypeBadge type={card.subtype} lang={lang} />
            <span className="rounded-full bg-surface px-2 py-0.5 text-xs font-medium text-foreground">
              {getCategoryLabel(card.category, lang)}
            </span>
            {card.stage && (
              <span className="rounded-full bg-surface px-2 py-0.5 text-xs font-medium text-foreground">
                {getStageLabel(card.stage, lang)}
              </span>
            )}
            <RarityBadge rarity={card.rarity} shiny={card.shiny} lang={lang} />
          </div>

          {card.evolvesFrom && (
            <p className="mt-3 text-sm text-muted">
              {t.evolvesFrom}: {getJapaneseSpeciesName(card.evolvesFrom, lang)}
            </p>
          )}

          <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-line pt-4">
            {card.health != null && <InfoRow label={t.hp}>{card.health}</InfoRow>}
            <InfoRow label={t.series}>
              {expansion?.releaseDate ? (
                <Link href={`/packs#${expansion.id}`} className="text-accent hover:text-accent-strong">
                  {getJapaneseSeriesName(card.setCode, card.setName, lang)}
                </Link>
              ) : (
                getJapaneseSeriesName(card.setCode, card.setName, lang)
              )}
            </InfoRow>
          </dl>
        </div>
      </div>

      <AcquisitionSection card={card} lang={lang} />
      <PullRateSection card={card} lang={lang} />

      {card.attacks.length > 0 && (
        <section className="mt-8 border-t border-line pt-6">
          <h2 className="text-sm font-semibold text-muted">{t.moves}</h2>
          <div className="mt-3 space-y-4">
            {card.attacks.map((attack) => (
              <div key={attack.name}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <AttackCostIcons cost={attack.cost} lang={lang} />
                    <span className="font-semibold text-foreground">
                      {getJapaneseMoveName(attack.name, lang)}
                    </span>
                  </div>
                  {attack.damage != null && (
                    <span className="font-semibold text-foreground">{attack.damage}</span>
                  )}
                </div>
                {attack.effect && (
                  <p className="mt-1 text-sm text-muted">
                    {getJapaneseMoveEffect(attack.effect, lang)}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {card.ability && (
        <section className="mt-8 border-t border-line pt-6">
          <h2 className="text-sm font-semibold text-muted">{t.ability}</h2>
          <p className="mt-3 font-semibold text-foreground">
            {getJapaneseAbilityName(card.ability.name, lang)}
          </p>
          {card.ability.effect && (
            <p className="mt-1 text-sm text-muted">
              {getJapaneseAbilityEffect(card.ability.effect, lang)}
            </p>
          )}
        </section>
      )}

      {card.cardText && (
        <section className="mt-8 border-t border-line pt-6">
          <p className="text-sm text-muted">{card.cardText}</p>
        </section>
      )}

      {(card.weakness || card.retreat != null) && (
        <section className="mt-8 flex gap-10 border-t border-line pt-6">
          {card.weakness && (
            <InfoRow label={t.weakness}>
              <EnergyDot type={card.weakness} />
            </InfoRow>
          )}
          {card.retreat != null && (
            <InfoRow label={t.retreatCost}>
              <RetreatCostIcons count={card.retreat} lang={lang} />
            </InfoRow>
          )}
        </section>
      )}
    </main>
  );
}
