import type { Metadata } from "next";
import { Inter, Noto_Sans_JP, Geist_Mono } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { getLang } from "@/lib/i18n/lang";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { AuthProvider } from "@/lib/auth/AuthProvider";
import { MigrationGate } from "@/components/MigrationGate";
import "./globals.css";

// 開発中に計測データが混ざらないよう、本番ビルドの時だけGA4を読み込む
const gaId = process.env.NODE_ENV === "production" ? process.env.NEXT_PUBLIC_GA_ID : undefined;

// 英数字はInter、日本語はNoto Sans JPを使う(body { font-family }でこの順に指定)
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pocket Base",
  description: "Pokémon Trading Card Game Pocketの非公式カード検索・データベースサイト",
  verification: {
    google: "7oPD_y6SwMaa1YOX2PZRMZ4HFM2cmtPdScorjurBiJk",
  },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const lang = await getLang();

  return (
    <html
      lang={lang}
      className={`${inter.variable} ${notoSansJP.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <LanguageProvider lang={lang}>
          <AuthProvider>
            <MigrationGate />
            <SiteHeader />
            {/*
              bodyがflexコンテナのため、中身が「縮まない」CSSの癖を防ぐために
              min-w-0を付けている(flexの子要素は、中の文章や横並び要素の分だけ
              幅を広げようとする性質があり、それがページ全体の横スクロールの原因になる)。
            */}
            <div className="min-w-0 flex-1">{children}</div>
            <SiteFooter />
          </AuthProvider>
        </LanguageProvider>
      </body>
      {gaId && <GoogleAnalytics gaId={gaId} />}
    </html>
  );
}
