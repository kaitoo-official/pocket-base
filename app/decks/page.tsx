import { getAllCardOptions } from "@/lib/cardOptions";
import { getOptionsFromCardTypes, getOptionsFromCardRarities } from "@/lib/filterOptions";
import { getLang } from "@/lib/i18n/lang";
import { DecksPageClient } from "@/components/DecksPageClient";

// デッキ編集は未ログインでも(localStorageへの)仮組みができる仕様のため、
// このページはRequireAuthで保護せず、lib/decks.tsのuseDecks側でログイン状態を吸収する。
export default async function DecksPage() {
  const lang = await getLang();
  const cards = getAllCardOptions(lang);
  return (
    <DecksPageClient
      cards={cards}
      typeOptions={getOptionsFromCardTypes(cards, lang)}
      rarityOptions={getOptionsFromCardRarities(cards, lang)}
      lang={lang}
    />
  );
}
