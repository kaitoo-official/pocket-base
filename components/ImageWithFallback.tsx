"use client";

import Image from "next/image";
import { useState } from "react";
import { FALLBACK_CARD_IMAGE } from "@/lib/getCardImage";

interface ImageWithFallbackProps {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
}

/**
 * next/imageのラッパー。画像の読み込みに失敗した時(リンク切れ等)、
 * 自動的にfallback画像に切り替える。
 *
 * "use client" が付いているのはこのファイルだけ。読み込み失敗を検知する
 * onErrorはブラウザ側で動く処理(クリックやエラー検知など)なので、
 * Client Component(ブラウザ側でも動くコンポーネント)にする必要がある。
 * これを使う側(CardTileなど)は今まで通りサーバー側で動くままでよい。
 */
export function ImageWithFallback({ src, alt, sizes, className }: ImageWithFallbackProps) {
  const [imgSrc, setImgSrc] = useState(src);

  return (
    <Image
      src={imgSrc}
      alt={alt}
      fill
      sizes={sizes}
      className={className}
      onError={() => setImgSrc(FALLBACK_CARD_IMAGE)}
    />
  );
}
