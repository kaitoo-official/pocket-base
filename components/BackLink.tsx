import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

/** 詳細ページ上部にある「一覧へ戻る」リンク。ボタンらしい見た目にしている */
export function BackLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 py-1.5 text-sm text-muted shadow-sm transition-colors hover:border-accent/40 hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4" />
      {children}
    </Link>
  );
}
