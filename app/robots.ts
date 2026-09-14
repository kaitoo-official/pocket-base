import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://example.com";

/** Next.jsのMetadata API(app/robots.ts規約)によるrobots.txtの自動生成 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // 現状このサイトに管理画面・API等のページは無いが、将来追加した時に
      // 検索結果へ出さないよう先に除外しておく
      disallow: ["/api/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
