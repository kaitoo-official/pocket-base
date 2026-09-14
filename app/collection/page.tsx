import { getAllCardOptions } from "@/lib/cardOptions";
import { getLang } from "@/lib/i18n/lang";
import { CollectionPageClient } from "@/components/CollectionPageClient";

export default async function CollectionPage() {
  const lang = await getLang();
  const cards = getAllCardOptions(lang);
  return <CollectionPageClient cards={cards} lang={lang} />;
}
