"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { Capacitor } from "@capacitor/core";
import { auth } from "@/lib/firebase";
import { syncUserProfile } from "@/lib/users";
import { backfillProfileFromProvider, signInWithApple, signInWithGoogle, type SignInResult } from "@/lib/auth/googleAuth";
import { AuthSignInSheet } from "@/components/AuthSignInSheet";

export interface AuthState {
  /** 匿名認証中のユーザーも含む、Firebase Authが把握している現在のユーザー */
  user: User | null;
  /** Googleログイン済みかどうか(裏で動く匿名認証だけの状態はfalseになる) */
  isSignedIn: boolean;
  /** 起動直後、まだセッション復元が終わっていない間はtrue */
  loading: boolean;
  /**
   * ログインを開始する共通の窓口。Androidアプリ版はそのままGoogleログインを行い、
   * iOSアプリ版とWeb版は「Appleでサインイン/Googleでログイン」を選ぶボトムシートを表示する
   * (Apple IDでのログインを提供できないAndroidだけ例外的にシートを出さない)。
   */
  signIn: () => Promise<SignInResult>;
}

const AuthContext = createContext<AuthState>({
  user: null,
  isSignedIn: false,
  loading: true,
  signIn: async () => ({ status: "cancelled" }),
});

/**
 * Firebase Authのログイン状態をアプリ全体に配るプロバイダー。
 * ページリロード後もFirebase SDK側がセッションを復元してonAuthStateChangedが
 * 発火するため、ここでは購読するだけでログイン状態の維持が実現できる。
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Omit<AuthState, "signIn">>({ user: null, isSignedIn: false, loading: true });
  const [sheetOpen, setSheetOpen] = useState(false);
  const resolveSignInRef = useRef<((result: SignInResult) => void) | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      const isSignedIn = user != null && !user.isAnonymous;
      setState({ user, isSignedIn, loading: false });
      if (isSignedIn && user) {
        void syncUserProfile(user);
        // リンク直後はuser.displayName/photoURLが空のことがあるため、補完後に再度反映する
        void backfillProfileFromProvider(user).then(() => {
          setState({ user, isSignedIn, loading: false });
        });
      }
    });
    return unsubscribe;
  }, []);

  const signIn = useCallback((): Promise<SignInResult> => {
    // Androidアプリ版はApple IDでのログインを提供できないため、選択肢を出さず直接Googleへ。
    if (Capacitor.getPlatform() === "android") {
      return signInWithGoogle();
    }
    return new Promise<SignInResult>((resolve) => {
      resolveSignInRef.current = resolve;
      setSheetOpen(true);
    });
  }, []);

  const handleChoose = useCallback(async (provider: "apple" | "google") => {
    setSheetOpen(false);
    const result = provider === "apple" ? await signInWithApple() : await signInWithGoogle();
    resolveSignInRef.current?.(result);
    resolveSignInRef.current = null;
  }, []);

  const handleDismiss = useCallback(() => {
    setSheetOpen(false);
    resolveSignInRef.current?.({ status: "cancelled" });
    resolveSignInRef.current = null;
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, signIn }}>
      {children}
      <AuthSignInSheet open={sheetOpen} onChoose={handleChoose} onDismiss={handleDismiss} />
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  return useContext(AuthContext);
}
