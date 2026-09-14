import type { MetadataRoute } from "next";
import { getAllCards, getAllExpansions } from "@/lib/data";

// 本番ドメインが決まるまでの仮の値。決まったら.env.local(や本番のホスティング先の
// 環境変数設定)のNEXT_PUBLIC_SITE_URLを実際のドメインに差し替えるだけでよい
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://example.com";

/**
 * Next.jsのMetadata API(app/sitemap.ts規約)によるsitemap.xmlの自動生成。
 * カード・パックはデータソース(pokemon-tcg-pocket-cards)から動的に列挙するため、
 * カードやパックが追加されてもこのファイルの変更は不要。
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const cardUrls = getAllCards().map((card) => ({
    url: `${SITE_URL}/cards/${card.id}`,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const packUrls = getAllExpansions().flatMap((expansion) =>
    expansion.packs.map((pack) => ({
      url: `${SITE_URL}/packs/${pack.id}`,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }))
  );

  return [
    {
      url: SITE_URL,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${SITE_URL}/cards`,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/packs`,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/trade`,
      changeFrequency: "hourly",
      priority: 0.7,
    },
    ...cardUrls,
    ...packUrls,
  ];
}
