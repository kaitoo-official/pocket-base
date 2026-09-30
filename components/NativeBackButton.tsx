"use client";

import { useEffect } from "react";
import { App } from "@capacitor/app";
import { useIsNativeApp } from "@/lib/useIsNativeApp";

/**
 * Androidの端末の戻るボタン対応。
 * @capacitor/appを入れずに素のまま使うと、Next.jsのページ遷移(history.pushState)が
 * WebViewの戻る履歴として認識されず、戻るボタンを押すといきなりアプリが
 * バックグラウンドに行ってしまう(＝実質終了したように見える)。
 * ページ履歴があればブラウザの「戻る」として扱い、無ければアプリを終了する。
 */
export function NativeBackButton() {
  const isNative = useIsNativeApp();

  useEffect(() => {
    if (!isNative) return;

    const listenerPromise = App.addListener("backButton", ({ canGoBack }) => {
      if (canGoBack) {
        window.history.back();
      } else {
        App.exitApp();
      }
    });

    return () => {
      listenerPromise.then((listener) => listener.remove());
    };
  }, [isNative]);

  return null;
}
