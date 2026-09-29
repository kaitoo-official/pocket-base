"use client";

import { useEffect } from "react";
import { useIsNativeApp } from "@/lib/useIsNativeApp";

/**
 * アプリ版(Capacitor)のWebViewにはブラウザのUIが無いため、ピンチズームで拡大すると
 * 元の倍率に戻す手段がなくなってしまう(ダブルタップやピンチアウトが効かないことがある)。
 * Web版ではズームできる方が望ましいので、ネイティブ版の時だけviewportのズームを禁止する。
 */
export function NativeViewportLock() {
  const isNative = useIsNativeApp();

  useEffect(() => {
    if (!isNative) return;
    const meta = document.querySelector('meta[name="viewport"]');
    if (!meta) return;
    const original = meta.getAttribute("content");
    meta.setAttribute(
      "content",
      "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
    );
    return () => {
      if (original) meta.setAttribute("content", original);
    };
  }, [isNative]);

  return null;
}
