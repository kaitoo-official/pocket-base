import Link from "next/link";
import type { Card } from "@/types/card";
import { getJapaneseName, getJapanesePackName, getJapaneseSeriesName } from "@/lib/nameJa";
import { getAcquisitionMethod } from "@/lib/filter";
import { getExpansionById, getPackForCard } from "@/lib/data";
import { getRelatedCards, type RelatedCardRelation } from "@/lib/acquisition";
import { getCardImageUrl } from "@/lib/getCardImage";
import { ImageWithFallback } from "@/components/ImageWithFallback";
import { InfoRow } from "@/components/InfoRow";
import { RarityIcon } from "@/components/RarityIcon";
import { getDict } from "@/lib/i18n/dict";
import type { Lang } from "@/lib/i18n/lang";

/**
 * 「入手方法」専用のセクション。このアプリで最も重視している情報のため、独立させている。
 * データに存在する範囲(パック・プロモの内訳・トレード・ゲットチャレンジ・他バージョン)だけを表示し、
 * イベント配布の詳細などデータに無い情報は表示しない。
 */
export function AcquisitionSection({ card, lang = "ja" }: { card: Card; lang?: Lang }) {
  const t = getDict(lang).acquisition;
  const method = getAcquisitionMethod(card);
  const relatedCards = getRelatedCards(card);
  const packMatch = getPackForCard(card);
  const expansion = getExpansionById(card.setCode);

  const relationLabels: Record<RelatedCardRelation, string> = {
    before: t.relationBefore,
    after: t.relationAfter,
    variant: t.relationVariant,
  };

  return (
    <section className="mt-8 rounded-xl border border-line bg-surface p-5">
      <h2 className="text-sm font-semibold text-foreground">{t.title}</h2>

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-4 text-sm sm:grid-cols-3">
        <InfoRow label={t.pack}>
          {packMatch ? (
            <Link
              href={`/packs/${packMatch.pack.id}`}
              className="text-accent hover:text-accent-strong"
            >
              {getJapanesePackName(card.pack, lang)}
            </Link>
          ) : (
            getJapanesePackName(card.pack, lang)
          )}
        </InfoRow>
        <InfoRow label={t.series}>
          {expansion?.releaseDate ? (
            <Link href={`/packs#${expansion.id}`} className="text-accent hover:text-accent-strong">
              {getJapaneseSeriesName(card.setCode, card.setName, lang)}
            </Link>
          ) : (
            getJapaneseSeriesName(card.setCode, card.setName, lang)
          )}
        </InfoRow>
        <InfoRow label={t.category}>
          {method === "promo" ? t.promo(getJapanesePackName(card.pack, lang)) : t.packPull}
        </InfoRow>

        {card.packPoints != null && (
          <InfoRow label={t.craftPoints}>{card.packPoints.toLocaleString()}pt</InfoRow>
        )}

        <InfoRow label={t.trade}>
          {card.tradable
            ? card.tradeCost
              ? t.tradeAvailableWithCost(card.tradeCost.toLocaleString())
              : t.tradeAvailable
            : t.tradeUnavailable}
        </InfoRow>

        <InfoRow label={t.wonderPick}>{card.sharable ? t.sendable : t.notSendable}</InfoRow>
      </dl>

      {relatedCards.length > 0 && (
        <div className="mt-5 border-t border-line pt-4">
          <p className="text-xs text-muted">{t.relatedCards}</p>
          <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
            {relatedCards.map(({ card: related, relation }) => (
              <Link
                key={`${relation}-${related.id}`}
                href={`/cards/${related.id}`}
                className="flex w-24 shrink-0 flex-col items-center gap-1.5 text-center transition-opacity hover:opacity-80"
              >
                <div className="relative aspect-[245/342] w-full overflow-hidden rounded-lg bg-surface">
                  <ImageWithFallback
                    src={getCardImageUrl(related)}
                    alt={getJapaneseName(related, lang) ?? related.name}
                    sizes="96px"
                    className="object-contain"
                  />
                </div>
                <span className="rounded-full bg-surface-hover px-2 py-0.5 text-[10px] font-medium text-muted">
                  {relationLabels[relation]}
                </span>
                <span className="flex items-center gap-1">
                  <RarityIcon rarity={related.rarity} shiny={related.shiny} className="h-3.5" />
                  <span className="text-[11px] leading-tight text-muted">
                    {relation === "variant"
                      ? getJapaneseSeriesName(related.setCode, related.setName, lang)
                      : (getJapaneseName(related, lang) ?? related.name)}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
