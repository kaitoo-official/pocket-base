"use client";

import type { MouseEvent } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useCollection, MAX_COLLECTION_QUANTITY } from "@/lib/collection";
import { signInWithGoogle } from "@/lib/auth/googleAuth";
import type { Lang } from "@/lib/i18n/lang";

/**
 * カード1枚分のマイコレクション+/-ステッパー(コンパクト版)。ログイン必須のため、
 * 未ログイン時に押すとそのままGoogleログインを促す。1枚の状態から減らす操作は
 * 削除を意味するため、その時だけゴミ箱アイコンにする。
 * CardTile等のLinkの外側に置くこと(aタグの中にbuttonをネストしないため)。
 */
export function CollectionStepper({ cardId, lang = "ja" }: { cardId: string; lang?: Lang }) {
  const { isSignedIn } = useAuth();
  const { getQuantity, setQuantity, loading } = useCollection();
  const quantity = isSignedIn ? getQuantity(cardId) : 0;

  function handleChange(delta: number) {
    return async (event: MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      if (!isSignedIn) {
        await signInWithGoogle();
        return;
      }
      void setQuantity(cardId, quantity + delta);
    };
  }

  return (
    <div
      onClick={(event) => event.preventDefault()}
      className="flex items-center gap-1 rounded-full border border-line bg-white px-1 py-0.5 shadow-xs"
    >
      <button
        type="button"
        disabled={loading || (isSignedIn && quantity <= 0)}
        onClick={handleChange(-1)}
        aria-label={
          quantity === 1
            ? lang === "en"
              ? "Remove from collection"
              : "コレクションから削除"
            : lang === "en"
              ? "Decrease quantity"
              : "枚数を減らす"
        }
        className={`flex h-6 w-6 items-center justify-center rounded-full transition-colors disabled:opacity-30 ${
          quantity === 1 ? "text-red-600 hover:text-red-700" : "text-foreground hover:text-accent"
        }`}
      >
        {quantity === 1 ? <Trash2 className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
      </button>
      <span className="min-w-4 text-center text-xs font-bold text-foreground">
        {quantity >= MAX_COLLECTION_QUANTITY ? `${MAX_COLLECTION_QUANTITY}+` : quantity}
      </span>
      <button
        type="button"
        disabled={loading || quantity >= MAX_COLLECTION_QUANTITY}
        onClick={handleChange(1)}
        aria-label={lang === "en" ? "Increase quantity" : "枚数を増やす"}
        className="flex h-6 w-6 items-center justify-center rounded-full text-foreground transition-colors hover:text-accent disabled:opacity-30"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
