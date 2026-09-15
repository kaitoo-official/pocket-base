import Link from "next/link";
import { Logo } from "@/components/Logo";
import { Container } from "@/components/Container";
import { FeedbackLink } from "@/components/FeedbackLink";
import { getLang } from "@/lib/i18n/lang";
import { getDict } from "@/lib/i18n/dict";

/**
 * 全ページ共通のフッター。
 * 非公式ファンサイトである旨の注意書きと、データ・画像の提供元クレジットを表示する。
 * 具体的な文言は後で調整できるよう、シンプルな構造にしている。
 */
export async function SiteFooter() {
  const lang = await getLang();
  const t = getDict(lang).footer;

  return (
    <footer className="hero-dark border-t border-line bg-hero-gradient-dark">
      <Container className="py-10">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Logo />
          <p className="text-[11px] font-semibold tracking-[0.2em] text-muted">{t.tagline}</p>
        </div>

        <div className="mt-6 space-y-2 border-t border-line pt-6 text-xs leading-relaxed text-muted">
          <p>{t.disclaimer}</p>
          <p>
            {t.dataCredit}:{" "}
            <a
              href="https://github.com/PocketDecks/pokemon-tcg-pocket-cards"
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-line underline-offset-2 transition-colors hover:text-accent"
            >
              pokemon-tcg-pocket-cards
            </a>
            {" / "}
            {t.nameCredit}:{" "}
            <a
              href="https://pokeapi.co/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-line underline-offset-2 transition-colors hover:text-accent"
            >
              PokeAPI
            </a>
          </p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <Link
              href="/privacy"
              className="text-xs text-muted underline decoration-line underline-offset-2 transition-colors hover:text-accent"
            >
              {t.privacyLink}
            </Link>
            <FeedbackLink />
          </div>
        </div>
      </Container>
    </footer>
  );
}
