import type { ReactNode } from "react";

/** 「ラベル: 値」を並べて表示するだけの小さな部品(HP、シリーズ、パック等で使う) */
export function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="text-sm font-medium text-foreground">{children}</dd>
    </div>
  );
}
