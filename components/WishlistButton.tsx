"use client";

import { Star } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useWishlist } from "@/lib/wishlist";
import { signInWithGoogle } from "@/lib/auth/googleAuth";

/**
 * カード1枚のWishlist(欲しい)トグルボタン。ログイン必須のため、
 * 未ログイン時に押すとそのままGoogleログインを促す。
 * CardTile等のLinkの外側に置くこと(aタグの中にbuttonをネストしないため)。
 */
export function WishlistButton({ cardId, className = "" }: { cardId: string; className?: string }) {
  const { isSignedIn } = useAuth();
  const { isWishlisted, toggleWishlist, loading } = useWishlist();
  const active = isSignedIn && isWishlisted(cardId);

  return (
    <button
      type="button"
      disabled={loading}
      aria-pressed={active}
      aria-label={active ? "Wishlistから削除" : "Wishlistに追加"}
      onClick={async (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (!isSignedIn) {
          await signInWithGoogle();
          return;
        }
        void toggleWishlist(cardId);
      }}
      className={`flex h-7 w-7 items-center justify-center rounded-full bg-white/90 shadow-xs backdrop-blur-sm transition-transform hover:scale-110 disabled:opacity-60 ${className}`}
    >
      <Star className={`h-4 w-4 ${active ? "fill-amber-400 text-amber-400" : "text-muted"}`} />
    </button>
  );
}
