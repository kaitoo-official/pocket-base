import { getAllCardOptions } from "@/lib/cardOptions";
import { getOptionsFromCardTypes, getOptionsFromCardRarities } from "@/lib/filterOptions";
import { getLang } from "@/lib/i18n/lang";
import { MyTradesPageClient } from "@/components/MyTradesPageClient";

export default async function MyTradesPage() {
  const lang = await getLang();
  const cards = getAllCardOptions(lang);
  return (
    <MyTradesPageClient
      cards={cards}
      typeOptions={getOptionsFromCardTypes(cards, lang)}
      rarityOptions={getOptionsFromCardRarities(cards, lang)}
      lang={lang}
    />
  );
}
