import { getAllCardOptions } from "@/lib/cardOptions";
import { getLang } from "@/lib/i18n/lang";
import { WishlistPageClient } from "@/components/WishlistPageClient";

export default async function WishlistPage() {
  const lang = await getLang();
  const cards = getAllCardOptions(lang);
  return <WishlistPageClient cards={cards} lang={lang} />;
}
