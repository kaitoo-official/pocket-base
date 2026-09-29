// Google/Appleログイン・ログアウトの窓口。
//
// ゲスト状態ではlib/authUid.tsが裏で匿名認証(signInAnonymously)を行っている
// (コメント削除の本人確認用)。ログイン時に現在のユーザーが匿名なら、
// サインインではなく「匿名アカウントにリンク」することで同じUIDを維持し、
// ゲスト時に付けたコメントの所有権が引き続き有効になるようにしている。
// 既に別デバイスでそのアカウントを使用済みでリンクできない場合のみ、
// 通常のサインインにフォールバックする(匿名データの引き継ぎは諦める)。
//
// どちらのプロバイダを使うか選ばせるUI(ボトムシート)はlib/auth/AuthProvider.tsxが
// 担当する。呼び出し元は共通のuseAuth().signIn()を使うこと(Android版は自動的に
// Googleログインへ、iOS版とWeb版はシートを表示してAppleかGoogleかを選ばせる)。

import {
  GoogleAuthProvider,
  OAuthProvider,
  linkWithCredential,
  linkWithPopup,
  signInWithCredential,
  signInWithPopup,
  signInWithRedirect,
  signOut as firebaseSignOut,
  updateProfile,
  type AuthCredential,
  type User,
} from "firebase/auth";
import { Capacitor } from "@capacitor/core";
import { FirebaseAuthentication } from "@capacitor-firebase/authentication";
import { auth } from "@/lib/firebase";

const googleProvider = new GoogleAuthProvider();

const appleProvider = new OAuthProvider("apple.com");
appleProvider.addScope("email");
appleProvider.addScope("name");

export type SignInResult =
  | { status: "success"; user: User }
  | { status: "cancelled" }
  | { status: "redirecting" }
  | { status: "error"; message: string };

function getErrorCode(error: unknown): string | undefined {
  return typeof error === "object" && error !== null && "code" in error
    ? String((error as { code: unknown }).code)
    : undefined;
}

/**
 * 匿名アカウントをGoogleにリンクした直後は、Firebaseの仕様上トップレベルの
 * user.displayName/user.photoURLが空のまま残ることがある(実際の値はリンクされた
 * Googleプロバイダ自身のprovider情報(providerData)にだけ入っている)。
 * ヘッダーのプロフィール表示等がuser.displayName/photoURLを直接参照しても
 * 正しく出るよう、ここでトップレベルにも書き戻しておく。
 */
export async function backfillProfileFromProvider(user: User): Promise<void> {
  const googleProviderData = user.providerData[0];
  const update: { displayName?: string; photoURL?: string } = {};
  if (!user.displayName && googleProviderData?.displayName) update.displayName = googleProviderData.displayName;
  if (!user.photoURL && googleProviderData?.photoURL) update.photoURL = googleProviderData.photoURL;
  if (Object.keys(update).length > 0) {
    await updateProfile(user, update);
  }
}

/**
 * 匿名ユーザーならGoogleアカウントにリンクを試み(データ引き継ぎ)、
 * 既に別デバイス等でそのGoogleアカウントが使用済みでリンクできない場合のみ
 * 通常のサインインにフォールバックする。ID トークンから作った credential は
 * (ポップアップ由来のものと違い)使い回せるので、リンク→サインインの両方で
 * 同じ credential を使える。
 */
export async function signInOrLinkWithCredential(credential: AuthCredential): Promise<SignInResult> {
  const currentUser = auth.currentUser;

  if (currentUser?.isAnonymous) {
    try {
      const result = await linkWithCredential(currentUser, credential);
      return { status: "success", user: result.user };
    } catch (linkError) {
      if (getErrorCode(linkError) !== "auth/credential-already-in-use") {
        throw linkError;
      }
    }
  }

  const result = await signInWithCredential(auth, credential);
  return { status: "success", user: result.user };
}

/**
 * アプリ版(Capacitor)用のログイン。
 * ブラウザのポップアップ/リダイレクトの仕組みはWebView内では正しく機能しない
 * (Googleがアプリ内WebViewからのログインをブロックする、またリダイレクト方式は
 * 外部Chromeとアプリ内WebViewでログイン状態が別々になり結果が戻らない)ため、
 * Androidネイティブのログイン画面(@capacitor-firebase/authentication)を使い、
 * その結果のIDトークンをWeb版と共通のFirebase JS SDKに渡して認証状態を揃える。
 */
async function signInWithGoogleNative(): Promise<SignInResult> {
  try {
    const { credential } = await FirebaseAuthentication.signInWithGoogle();
    const idToken = credential?.idToken;
    if (!idToken) {
      return { status: "cancelled" };
    }
    return await signInOrLinkWithCredential(GoogleAuthProvider.credential(idToken));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/cancel/i.test(message)) {
      return { status: "cancelled" };
    }
    return { status: "error", message: "ログインに失敗しました。時間をおいて試してください。" };
  }
}

async function signInWithGoogleWeb(): Promise<SignInResult> {
  try {
    const currentUser = auth.currentUser;

    if (currentUser?.isAnonymous) {
      try {
        const result = await linkWithPopup(currentUser, googleProvider);
        return { status: "success", user: result.user };
      } catch (linkError) {
        // 既に別デバイス等でそのGoogleアカウントにログイン済みの場合はリンクできない。
        // その場合は匿名データの引き継ぎを諦めて、通常のGoogleログインを試す。
        if (getErrorCode(linkError) !== "auth/credential-already-in-use") {
          throw linkError;
        }
      }
    }

    const result = await signInWithPopup(auth, googleProvider);
    return { status: "success", user: result.user };
  } catch (error) {
    const code = getErrorCode(error);

    if (code === "auth/popup-blocked") {
      // ポップアップがブロックされた場合はリダイレクト方式にフォールバックする。
      // このあとページ遷移するため、呼び出し元での後続処理は基本的に走らない。
      await signInWithRedirect(auth, googleProvider);
      return { status: "redirecting" };
    }
    if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
      return { status: "cancelled" };
    }
    return { status: "error", message: "ログインに失敗しました。時間をおいて試してください。" };
  }
}

export async function signInWithGoogle(): Promise<SignInResult> {
  return Capacitor.isNativePlatform() ? signInWithGoogleNative() : signInWithGoogleWeb();
}

/**
 * iOSアプリ版用のApple ID認証。@capacitor-firebase/authenticationはskipNativeAuth:trueの
 * 設定でも、ネイティブのAppleサインインダイアログ自体は表示し、その結果(IDトークンと
 * nonce)だけを返してくれる。それをWeb版と共通のFirebase JS SDKに渡して認証状態を揃える。
 * Appleは氏名を初回ログイン時にしか返さないため、ネイティブ側の結果に含まれていれば
 * ここでプロフィールに保存しておく(2回目以降のログインでは空になる)。
 */
async function signInWithAppleNative(): Promise<SignInResult> {
  try {
    const { credential, user: nativeUser } = await FirebaseAuthentication.signInWithApple();
    const idToken = credential?.idToken;
    if (!idToken) {
      return { status: "cancelled" };
    }
    const oAuthCredential = appleProvider.credential({ idToken, rawNonce: credential?.nonce });
    const result = await signInOrLinkWithCredential(oAuthCredential);
    if (result.status === "success" && !result.user.displayName && nativeUser?.displayName) {
      await updateProfile(result.user, { displayName: nativeUser.displayName });
    }
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/cancel/i.test(message)) {
      return { status: "cancelled" };
    }
    return { status: "error", message: "ログインに失敗しました。時間をおいて試してください。" };
  }
}

async function signInWithAppleWeb(): Promise<SignInResult> {
  try {
    const currentUser = auth.currentUser;

    if (currentUser?.isAnonymous) {
      try {
        const result = await linkWithPopup(currentUser, appleProvider);
        return { status: "success", user: result.user };
      } catch (linkError) {
        if (getErrorCode(linkError) !== "auth/credential-already-in-use") {
          throw linkError;
        }
      }
    }

    const result = await signInWithPopup(auth, appleProvider);
    return { status: "success", user: result.user };
  } catch (error) {
    const code = getErrorCode(error);

    if (code === "auth/popup-blocked") {
      await signInWithRedirect(auth, appleProvider);
      return { status: "redirecting" };
    }
    if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
      return { status: "cancelled" };
    }
    return { status: "error", message: "ログインに失敗しました。時間をおいて試してください。" };
  }
}

/** iOSアプリ版ではネイティブのAppleサインイン、それ以外(Web)ではポップアップ方式を使う */
export async function signInWithApple(): Promise<SignInResult> {
  return Capacitor.getPlatform() === "ios" ? signInWithAppleNative() : signInWithAppleWeb();
}

export async function signOutOfGoogle(): Promise<void> {
  await firebaseSignOut(auth);
}
