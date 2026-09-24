import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.kaitooofficial.pocketbase",
  appName: "Pocket Base",
  // Capacitorが最低限必要とするだけのダミーフォルダ。
  // 実際の画面はserver.urlで指定した本番サイトを直接表示するため使われない。
  webDir: "capacitor-www",
  server: {
    // アプリ内で本番サイトをそのまま表示する(=コードを二重管理しない方式)。
    // これによりWeb側を更新するだけでアプリの内容も即座に反映される。
    // アプリ起動時はホーム画面ではなく、カード一覧から始まるようにしている。
    url: "https://pocket-base-delta.vercel.app/cards",
    cleartext: false,
  },
  plugins: {
    // capacitor-assetsで生成したandroid/app/src/main/res/drawable/splash.png を
    // 起動画面として表示する(これが無いとAndroid標準のアイコンのみの簡易画面になる)。
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: "#0b2d5b",
      androidSplashResourceName: "splash",
      showSpinner: false,
    },
  },
};

export default config;
