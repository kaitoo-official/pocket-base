import { getAllCardOptions } from "@/lib/cardOptions";
import { getLang } from "@/lib/i18n/lang";
import { MyPageClient } from "@/components/MyPageClient";

export default async function MyPage() {
  const lang = await getLang();
  const cards = getAllCardOptions(lang);
  return <MyPageClient cards={cards} lang={lang} />;
}
