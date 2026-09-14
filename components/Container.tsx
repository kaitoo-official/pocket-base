import type { ElementType, ReactNode } from "react";

/**
 * 各ページで重複していた「中央寄せ+最大幅+左右余白」の共通ラッパー。
 * max-width は 1280px(ご指定のPCコンテナ幅の上限)に統一する。
 * as で <main> 等、意味のあるタグに差し替えられる(見た目は変わらない)。
 */
export function Container({
  children,
  className = "",
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: ElementType;
}) {
  return <Tag className={`mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 ${className}`}>{children}</Tag>;
}
