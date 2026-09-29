"use client";

import { useEffect } from "react";
import { useIsNativeApp } from "@/lib/useIsNativeApp";

const LOCKED_VIEWPORT =
  "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover";

/**
 * アプリ版(Capacitor)のWebViewにはブラウザのUIが無いため、ピンチズームで拡大すると
 * 元の倍率に戻す手段がなくなってしまう(ダブルタップやピンチアウトが効かないことがある)。
 * Web版ではズームできる方が望ましいので、ネイティブ版の時だけviewportのズームを禁止する。
 *
 * Next.jsはページ遷移時にviewportのmetaタグを作り直すことがあり、一度書き換えるだけだと
 * 遷移先(例: トレード画面)でズームが復活してしまう。そのため<head>を監視して書き換え直し、
 * さらにiOSのピンチ操作(gesturestart)と2本指のタッチ移動そのものも止めておく。
 */
export function NativeViewportLock() {
  const isNative = useIsNativeApp();

  useEffect(() => {
    if (!isNative) return;

    const applyLock = () => {
      const meta = document.querySelector('meta[name="viewport"]');
      if (meta && meta.getAttribute("content") !== LOCKED_VIEWPORT) {
        meta.setAttribute("content", LOCKED_VIEWPORT);
      }
    };
    applyLock();

    const observer = new MutationObserver(applyLock);
    observer.observe(document.head, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["content"],
    });

    const preventGesture = (event: Event) => event.preventDefault();
    const preventMultiTouch = (event: TouchEvent) => {
      if (event.touches.length > 1) event.preventDefault();
    };
    document.addEventListener("gesturestart", preventGesture);
    document.addEventListener("touchmove", preventMultiTouch, { passive: false });

    return () => {
      observer.disconnect();
      document.removeEventListener("gesturestart", preventGesture);
      document.removeEventListener("touchmove", preventMultiTouch);
    };
  }, [isNative]);

  return null;
}
