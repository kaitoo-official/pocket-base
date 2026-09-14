"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { getGuestFavoriteIds, clearGuestFavoriteIds, mergeGuestFavoritesToCloud } from "@/lib/favorites";
import { mergeGuestDecksToCloud } from "@/lib/decks";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { getDict } from "@/lib/i18n/dict";

const GUEST_DECKS_KEY = "pocketbase_guest_decks";

function hasGuestData(): boolean {
  if (typeof window === "undefined") return false;
  if (getGuestFavoriteIds().length > 0) return true;
  try {
    const raw = window.localStorage.getItem(GUEST_DECKS_KEY);
    return Boolean(raw && (JSON.parse(raw) as unknown[]).length > 0);
  } catch {
    return false;
  }
}

/**
 * ログイン直後、この端末にゲスト時代のお気に入り・仮デッキが残っていれば
 * 「アカウントに引き継ぎますか？」を確認する。app/layout.tsxに常時マウントしておき、
 * ログイン状態が「未ログイン→ログイン済み」に変わった瞬間だけ判定する
 * (ログアウトするとcheckedRefをリセットし、次回ログイン時にまた判定できるようにする)。
 */
export function MigrationGate() {
  const { user, isSignedIn, loading } = useAuth();
  const lang = useLang();
  const t = getDict(lang).migrate;
  const [showPrompt, setShowPrompt] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [done, setDone] = useState(false);
  const checkedRef = useRef(false);

  useEffect(() => {
    if (loading) return;
    if (!isSignedIn || !user) {
      checkedRef.current = false;
      return;
    }
    if (checkedRef.current) return;
    checkedRef.current = true;
    Promise.resolve().then(() => {
      if (hasGuestData()) setShowPrompt(true);
    });
  }, [isSignedIn, user, loading]);

  if (!showPrompt || !user) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0B2D5B]/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-surface p-6 shadow-xl">
        <h2 className="text-base font-bold text-foreground">{t.title}</h2>
        <p className="mt-2 text-sm text-muted">{t.description}</p>

        {done ? (
          <p className="mt-4 text-sm font-medium text-accent-strong">{t.success}</p>
        ) : (
          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowPrompt(false)}
              className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-hover"
            >
              {t.skip}
            </button>
            <button
              type="button"
              disabled={migrating}
              onClick={async () => {
                setMigrating(true);
                await mergeGuestFavoritesToCloud(user.uid);
                clearGuestFavoriteIds();
                await mergeGuestDecksToCloud(user.uid);
                setMigrating(false);
                setDone(true);
                setTimeout(() => setShowPrompt(false), 1500);
              }}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-accent-strong disabled:opacity-60"
            >
              {t.migrate}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
