import { getDeckBrowserCards } from "@/lib/deckBrowserCards";
import {
  getTypeOptions,
  getRarityOptions,
  getStageOptions,
  getExpansionPackGroups,
} from "@/lib/filterOptions";
import { getLang } from "@/lib/i18n/lang";
import { DecksPageClient } from "@/components/DecksPageClient";

// デッキ編集は未ログインでも(localStorageへの)仮組みができる仕様のため、
// このページはRequireAuthで保護せず、lib/decks.tsのuseDecks側でログイン状態を吸収する。
//
// Deck Card Browser(カード選択UI)には、フルのCard型ではなくlib/deckBrowserCards.tsの
// 軽量DTO(DeckBrowserCard)を渡す。フルCard型(技・特性・効果文等を含む)を約3,879件分
// そのまま渡すと初期転送量が大きくなりすぎる(実測でgzip約485KB)ことが分かったため。
export default async function DecksPage() {
  const lang = await getLang();
  const cards = getDeckBrowserCards(lang);
  const packGroups = getExpansionPackGroups(lang);
  // シリーズ絞り込みの選択肢は、グループ(A/Bシリーズ・プロモ)を気にせず
  // フラットな一覧として見せたいため、ここで1段階だけ平らにする
  const seriesOptions = packGroups.flatMap((group) =>
    group.series.map((entry) => ({ value: entry.seriesId, label: entry.seriesName }))
  );
  // シリーズを選んだ時にそのシリーズ内のパックだけ選べるよう、seriesId→パック一覧で引けるようにする
  // (カード一覧ページのFilterPanelと同じgetExpansionPackGroups()のseries/pack構造をそのまま使う)
  const packOptionsBySeries = Object.fromEntries(
    packGroups.flatMap((group) => group.series.map((entry) => [entry.seriesId, entry.packs]))
  );

  return (
    <DecksPageClient
      cards={cards}
      typeOptions={getTypeOptions(lang)}
      rarityOptions={getRarityOptions(lang)}
      stageOptions={getStageOptions(lang)}
      seriesOptions={seriesOptions}
      packOptionsBySeries={packOptionsBySeries}
      lang={lang}
    />
  );
}
