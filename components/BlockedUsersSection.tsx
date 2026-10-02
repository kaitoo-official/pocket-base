"use client";

import { useEffect, useState } from "react";
import { UserX } from "lucide-react";
import { subscribeToBlockedUsers, unblockUser, type BlockedUserEntry } from "@/lib/blockedUsers";
import { useAuth } from "@/lib/auth/AuthProvider";
import { getDict } from "@/lib/i18n/dict";
import type { Lang } from "@/lib/i18n/lang";

/**
 * トレード投稿管理ページに置く、ブロックしたユーザーの一覧・ブロック解除UI。
 * Apple App Store Guideline 1.2対応(ブロック機能の管理画面)。
 */
export function BlockedUsersSection({ lang }: { lang: Lang }) {
  const t = getDict(lang).safety;
  const { user } = useAuth();
  const [entries, setEntries] = useState<BlockedUserEntry[]>([]);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToBlockedUsers(user.uid, setEntries);
    return unsubscribe;
  }, [user]);

  if (!user || entries.length === 0) return null;

  return (
    <div className="mt-6 rounded-xl border border-line bg-surface p-4 shadow-xs">
      <h2 className="text-sm font-bold text-foreground">{t.blockedUsersTitle}</h2>
      <p className="mt-1 text-xs text-muted">{t.blockedUsersDescription}</p>
      <div className="mt-3 space-y-2">
        {entries.map((entry) => (
          <div
            key={entry.blockedUid}
            className="flex items-center justify-between gap-2 rounded-lg border border-line bg-background px-3 py-2"
          >
            <div className="flex items-center gap-1.5">
              <UserX className="h-3.5 w-3.5 text-muted" />
              <span className="text-sm text-foreground">{entry.blockedNickname || entry.blockedUid.slice(0, 8)}</span>
            </div>
            <button
              type="button"
              onClick={() => void unblockUser(entry.blockedUid)}
              className="rounded-full border border-line px-3 py-1 text-xs font-medium text-foreground transition-colors hover:border-accent/40"
            >
              {t.unblockButton}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
