// Google/Appleでログインしたユーザーのプロフィール(Firestore: users/{uid})。

export type AuthProvider = "google" | "apple";

export interface UserProfile {
  /** Firebase AuthのUID。Firestoreのドキュメント ID と同じ値 */
  id: string;
  provider: AuthProvider;
  /** プロバイダ側のユーザーID */
  providerUid: string;
  displayName: string;
  email: string;
  photoURL: string;
  createdAt: Date | null;
  updatedAt: Date | null;
}
