"use client";

import { Heart } from "lucide-react";
import { useFavorites } from "@/lib/favorites";

/**
 * カード1枚のお気に入りトグルボタン。未ログインでもlocalStorageで動作する。
 * カード画像の上に重ねて使う想定なので、CardTile等のLinkの外側に置くこと
 * (aタグの中にbuttonをネストすると不正なHTML構造になるため)。
 */
export function FavoriteButton({ cardId, className = "" }: { cardId: string; className?: string }) {
  const { isFavorite, toggleFavorite, loading } = useFavorites();
  const active = isFavorite(cardId);

  return (
    <button
      type="button"
      disabled={loading}
      aria-pressed={active}
      aria-label={active ? "お気に入りから削除" : "お気に入りに追加"}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void toggleFavorite(cardId);
      }}
      className={`flex h-7 w-7 items-center justify-center rounded-full bg-white/90 shadow-xs backdrop-blur-sm transition-transform hover:scale-110 disabled:opacity-60 ${className}`}
    >
      <Heart className={`h-4 w-4 ${active ? "fill-red-500 text-red-500" : "text-muted"}`} />
    </button>
  );
}
