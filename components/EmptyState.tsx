import type { LucideIcon } from "lucide-react";

/** 「何も無い」状態を、アイコン付きで分かりやすく伝えるための共通部品 */
export function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-line bg-surface px-6 py-14 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-hover text-muted">
        <Icon className="h-6 w-6" />
      </span>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {description && <p className="text-sm text-muted">{description}</p>}
    </div>
  );
}
