import type { ReactNode } from "react";
import { AccountSidebar } from "@/components/AccountSidebar";

/**
 * マイページ・Wishlist・マイコレクション・マイデッキ・トレード投稿管理で共通の外枠。
 * 左にサイドナビ、右にページごとの中身を並べる(スマホでは縦積みになる)。
 */
export function AccountShell({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:flex-row sm:px-6">
      <AccountSidebar />
      <div className="min-w-0 flex-1">{children}</div>
    </main>
  );
}
