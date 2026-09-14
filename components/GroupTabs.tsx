"use client";

import { useState, type ReactNode } from "react";

interface GroupTabsProps {
  groups: { label: string; content: ReactNode }[];
}

/**
 * 「Aシリーズ／Bシリーズ」のように、タブを切り替えて表示を絞り込むための部品。
 * 実際のポケポケアプリの絞り込み画面と同じ、切り替え式のUI。
 * 中身(content)自体はサーバー側で作られたものをそのまま受け取り、
 * このコンポーネントは「どれを見せるか」の切り替えだけを担当する。
 */
export function GroupTabs({ groups }: GroupTabsProps) {
  const [active, setActive] = useState(groups[0]?.label);

  return (
    <div>
      <div className="mb-2 inline-flex gap-1 rounded-lg border border-line bg-background p-1">
        {groups.map((group) => (
          <button
            key={group.label}
            type="button"
            onClick={() => setActive(group.label)}
            className={`cursor-pointer rounded-md px-3 py-1 text-xs font-medium transition-colors ${
              active === group.label
                ? "bg-accent text-background"
                : "text-muted hover:text-foreground"
            }`}
          >
            {group.label}
          </button>
        ))}
      </div>

      {groups.map((group) => (
        <div key={group.label} hidden={active !== group.label}>
          {group.content}
        </div>
      ))}
    </div>
  );
}
