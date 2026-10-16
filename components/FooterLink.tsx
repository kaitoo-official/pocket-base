"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * フッターの内部リンク。今いるページと同じリンクを押したときは、何も起きないように見えて
 * 紛らわしいので、ページの一番上へスムーズにスクロールする。それ以外は通常のリンクとして動く。
 */
export function FooterLink({ href, children }: { href: string; children: ReactNode }) {
  const pathname = usePathname();

  return (
    <Link
      href={href}
      onClick={(event) => {
        if (pathname === href) {
          event.preventDefault();
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      }}
      className="text-xs text-muted underline decoration-line underline-offset-2 transition-colors hover:text-accent"
    >
      {children}
    </Link>
  );
}
