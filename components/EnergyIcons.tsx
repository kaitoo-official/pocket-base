import { ENERGY_LETTER_TO_TYPE, parseEnergyCost } from "@/lib/energyCost";
import { TypeIcon } from "@/components/TypeIcon";
import type { Lang } from "@/lib/i18n/lang";

export function EnergyDot({ type }: { type: string }) {
  return <TypeIcon type={type} className="h-6 w-6" />;
}

/** 技の必要エネルギーをアイコンで表示。例: "GGC" → 草・草・無色 */
export function AttackCostIcons({ cost, lang = "ja" }: { cost: string; lang?: Lang }) {
  const letters = parseEnergyCost(cost);
  if (letters.length === 0) {
    return <span className="text-xs text-muted">{lang === "en" ? "No energy required" : "エネルギー不要"}</span>;
  }
  return (
    <span className="inline-flex gap-1">
      {letters.map((letter, i) => (
        <EnergyDot key={i} type={ENERGY_LETTER_TO_TYPE[letter] ?? "Colorless"} />
      ))}
    </span>
  );
}

/** にげるためのエネルギー数を、無色のアイコンで表示 */
export function RetreatCostIcons({ count, lang = "ja" }: { count: number; lang?: Lang }) {
  if (count === 0) {
    return <span className="text-xs text-muted">{lang === "en" ? "None" : "不要"}</span>;
  }
  return (
    <span className="inline-flex gap-1">
      {Array.from({ length: count }, (_, i) => (
        <EnergyDot key={i} type="Colorless" />
      ))}
    </span>
  );
}
