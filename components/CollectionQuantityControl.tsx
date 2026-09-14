"use client";

import { Minus, Plus } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useCollection, MAX_COLLECTION_QUANTITY } from "@/lib/collection";
import { signInWithGoogle } from "@/lib/auth/googleAuth";
import type { Lang } from "@/lib/i18n/lang";

const LABELS_JA = ["未所持", "1枚", "2枚", "3枚以上"];
const LABELS_EN = ["Not owned", "1 copy", "2 copies", "3+ copies"];

/**
 * マイコレクション(所持枚数)の増減コントロール。ログイン必須。
 * 未ログイン時は押すとそのままGoogleログインを促す。
 */
export function CollectionQuantityControl({ cardId, lang = "ja" }: { cardId: string; lang?: Lang }) {
  const { isSignedIn } = useAuth();
  const { getQuantity, setQuantity, loading } = useCollection();
  const labels = lang === "en" ? LABELS_EN : LABELS_JA;

  if (!isSignedIn) {
    return (
      <button
        type="button"
        onClick={() => void signInWithGoogle()}
        className="text-xs font-medium text-accent underline decoration-line underline-offset-2 hover:text-accent-strong"
      >
        {lang === "en" ? "Sign in to track your collection" : "ログインしてコレクションを記録"}
      </button>
    );
  }

  const quantity = getQuantity(cardId);

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        disabled={loading || quantity <= 0}
        onClick={() => void setQuantity(cardId, quantity - 1)}
        aria-label={lang === "en" ? "Decrease quantity" : "枚数を減らす"}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-line text-foreground transition-colors hover:border-accent/40 disabled:opacity-40"
      >
        <Minus className="h-4 w-4" />
      </button>
      <span className="w-20 text-center text-sm font-semibold text-foreground">{labels[quantity]}</span>
      <button
        type="button"
        disabled={loading || quantity >= MAX_COLLECTION_QUANTITY}
        onClick={() => void setQuantity(cardId, quantity + 1)}
        aria-label={lang === "en" ? "Increase quantity" : "枚数を増やす"}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-line text-foreground transition-colors hover:border-accent/40 disabled:opacity-40"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
