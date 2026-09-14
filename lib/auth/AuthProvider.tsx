"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { syncUserProfile } from "@/lib/users";
import { backfillProfileFromProvider } from "@/lib/auth/googleAuth";

export interface AuthState {
  /** 匿名認証中のユーザーも含む、Firebase Authが把握している現在のユーザー */
  user: User | null;
  /** Googleログイン済みかどうか(裏で動く匿名認証だけの状態はfalseになる) */
  isSignedIn: boolean;
  /** 起動直後、まだセッション復元が終わっていない間はtrue */
  loading: boolean;
}

const AuthContext = createContext<AuthState>({ user: null, isSignedIn: false, loading: true });

/**
 * Firebase Authのログイン状態をアプリ全体に配るプロバイダー。
 * ページリロード後もFirebase SDK側がセッションを復元してonAuthStateChangedが
 * 発火するため、ここでは購読するだけでログイン状態の維持が実現できる。
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, isSignedIn: false, loading: true });

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

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  return useContext(AuthContext);
}
