// 技の必要エネルギーは、"GGC"のような1文字ずつのコードで表現されている。
// 1文字が1個のエネルギーを表す。"0"はエネルギー不要(無償の技)を意味する。

export const ENERGY_LETTER_TO_TYPE: Record<string, string> = {
  G: "Grass",
  R: "Fire",
  W: "Water",
  L: "Lightning",
  P: "Psychic",
  F: "Fighting",
  D: "Darkness",
  M: "Metal",
  C: "Colorless",
};

export function parseEnergyCost(cost: string): string[] {
  if (cost === "0") return [];
  return cost.split("");
}
