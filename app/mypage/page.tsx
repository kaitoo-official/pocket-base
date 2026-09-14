import { getLang } from "@/lib/i18n/lang";
import { MyPageClient } from "@/components/MyPageClient";

export default async function MyPage() {
  const lang = await getLang();
  return <MyPageClient lang={lang} />;
}
