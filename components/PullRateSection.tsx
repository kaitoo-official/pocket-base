import type { Card } from "@/types/card";
import { getPullRateEstimates } from "@/lib/pullRate";
import { getJapanesePackName } from "@/lib/nameJa";
import { getDict } from "@/lib/i18n/dict";
import type { Lang } from "@/lib/i18n/lang";

/** 数値を読みやすい桁数に丸める(小さい値は小数、大きい値は整数にする) */
function formatNumber(n: number): string {
  if (n >= 100) return Math.round(n).toLocaleString();
  if (n >= 10) return n.toFixed(1);
  return n.toFixed(2);
}

/** パーセント表示用。極小の確率でも0%と表示されないよう、有効な桁数を残す */
function formatPercent(probability: number): string {
  const pct = probability * 100;
  if (pct >= 1) return pct.toFixed(2);
  if (pct >= 0.01) return pct.toFixed(3);
  return pct.toFixed(4);
}

/**
 * カードの入手期待値(パックの排出確率から計算した、平均何パックで手に入るかの目安)を表示する。
 * プロモカードなど、そもそもパックから出ないカードでは何も表示しない。
 */
export function PullRateSection({ card, lang = "ja" }: { card: Card; lang?: Lang }) {
  const estimates = getPullRateEstimates(card);
  if (estimates.length === 0) return null;

  const t = getDict(lang).pullRate;

  return (
    <section className="mt-8 rounded-xl border border-line bg-surface p-5">
      <h2 className="text-sm font-semibold text-foreground">{t.sectionTitle}</h2>
      <p className="mt-1 text-xs text-muted">{t.description}</p>

      <div className="mt-4 space-y-3">
        {estimates.map((estimate) => (
          <div key={estimate.packId} className="rounded-lg bg-background p-3 text-sm">
            {estimates.length > 1 && (
              <p className="mb-1.5 font-semibold text-foreground">
                {getJapanesePackName(estimate.packName, lang)}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-muted">
              <span className="font-bold text-accent-strong">{t.average(formatNumber(estimate.averagePacksNeeded))}</span>
              <span>{t.confidence90(estimate.packsFor90Percent.toLocaleString())}</span>
              <span>{t.probability(formatPercent(estimate.probabilityPerPack))}</span>
              <span>{t.poolSize(estimate.poolSize.toLocaleString())}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
