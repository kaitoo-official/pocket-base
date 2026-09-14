import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // カード画像・パック画像はGitHub(raw.githubusercontent.com)から配信されているため、
    // このドメインの画像だけをNext.jsのImageコンポーネントで扱えるように許可する。
    remotePatterns: [
      {
        protocol: "https",
        hostname: "raw.githubusercontent.com",
        pathname: "/PocketDecks/pokemon-tcg-pocket-cards/**",
      },
      {
        protocol: "https",
        hostname: "raw.githubusercontent.com",
        pathname: "/chase-manning/pokemon-tcg-pocket-cards/**",
      },
      {
        // インフルエンサー動画セクションのYouTubeサムネイル用
        protocol: "https",
        hostname: "img.youtube.com",
        pathname: "/vi/**",
      },
    ],
  },
};

export default nextConfig;
