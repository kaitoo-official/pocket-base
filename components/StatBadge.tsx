import Link from "next/link";

interface StatBadgeProps {
  value: string;
  label: string;
  subLabel?: string;
  /** 指定すると、カード全体がこのリンク先へ遷移するボタンになる */
  href?: string;
}

/** Heroで使う統計表示。ボーダー付きのカード形状で「3,879 / CARDS / 総カード数」のように見せる */
export function StatBadge({ value, label, subLabel, href }: StatBadgeProps) {
  const content = (
    <>
      <p className="font-[family-name:var(--font-inter)] text-xl font-extrabold leading-none text-foreground sm:text-2xl">
        {value}
      </p>
      <p className="mt-1.5 text-[10px] font-semibold tracking-[0.15em] text-muted">{label}</p>
      {subLabel && <p className="mt-0.5 text-xs text-muted">{subLabel}</p>}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block rounded-xl border border-line bg-surface px-4 py-3.5 shadow-xs transition duration-200 hover:-translate-y-1 hover:border-accent/40 hover:shadow-md sm:px-5 sm:py-4"
      >
        {content}
      </Link>
    );
  }

  return (
    <div className="rounded-xl border border-line bg-surface px-4 py-3.5 shadow-xs sm:px-5 sm:py-4">
      {content}
    </div>
  );
}
