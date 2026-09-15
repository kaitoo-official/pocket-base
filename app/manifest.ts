import type { MetadataRoute } from "next";

/**
 * PWA(ホーム画面に追加してアプリのように使える機能)用のマニフェスト。
 * app/manifest.ts という規約のファイル名にするだけで、Next.jsが自動的に
 * manifest.jsonとして配信し、<head>にリンクタグも差し込んでくれる。
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Pocket Base",
    short_name: "Pocket Base",
    description: "Pokémon Trading Card Game Pocketの非公式カード検索・データベースサイト",
    start_url: "/",
    display: "standalone",
    background_color: "#0a1230",
    theme_color: "#0a1230",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
