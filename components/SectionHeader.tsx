import Link from "next/link";

/**
 * 「見出し + すべて見る→」のセクション見出し。Home/パック一覧などで共通利用する。
 */
export function SectionHeader({
  title,
  href,
  linkLabel = "すべて見る",
}: {
  title: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">{title}</h2>
      {href && (
        <Link
          href={href}
          className="text-sm font-medium text-muted transition-colors hover:text-accent"
        >
          {linkLabel} →
        </Link>
      )}
    </div>
  );
}
