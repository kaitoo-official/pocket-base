// クライアントコンポーネントからも安全に読み込める、言語まわりの型・定数だけを集めたファイル。
// next/headers(サーバー専用)を使う実際の読み取り処理は lib/i18n/lang.ts 側に置く
// (同じファイルにまとめると、クライアント側でこのファイルを import した時に
// next/headers ごとクライアントバンドルに含まれようとしてビルドエラーになるため)。

export type Lang = "ja" | "en";

export const LANG_COOKIE_NAME = "lang";
