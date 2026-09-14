// Googleログインしたユーザーのプロフィール(Firestore: users/{uid})。
// providerを持たせているのは、将来Google以外のログイン手段が増えた場合に
// 同じ形のドキュメントで扱えるようにするため(現時点ではgoogle固定)。

export type AuthProvider = "google";

export interface UserProfile {
  /** Firebase AuthのUID。Firestoreのドキュメント ID と同じ値 */
  id: string;
  provider: AuthProvider;
  /** プロバイダ側のユーザーID(Google側のUID) */
  providerUid: string;
  displayName: string;
  email: string;
  photoURL: string;
  createdAt: Date | null;
  updatedAt: Date | null;
}
