"use client";

import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";

/** Capacitorでネイティブアプリとして動いているか(Webサイトとしての閲覧ならfalse) */
export function useIsNativeApp() {
  const [isNative, setIsNative] = useState(false);
  useEffect(() => {
    setIsNative(Capacitor.isNativePlatform());
  }, []);
  return isNative;
}
