import Link from "next/link";
import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { FeedbackLink } from "@/components/FeedbackLink";
import { getLang } from "@/lib/i18n/lang";
import { getDict } from "@/lib/i18n/dict";

export const metadata: Metadata = {
  title: "サポート | Pocket Base",
};

/** App Store「サポートURL」用のサポートページ。連絡手段(フィードバックフォーム)とよくある質問を載せる */
export default async function SupportPage() {
  const lang = await getLang();
  const t = getDict(lang).support;
  const footerT = getDict(lang).footer;

  return (
    <Container as="main" className="py-10">
      <h1 className="text-2xl font-bold text-foreground">{t.title}</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">{t.intro}</p>

      <section className="mt-8 max-w-2xl rounded-2xl border border-line bg-surface p-5">
        <p className="text-sm leading-relaxed text-foreground">{t.feedbackLead}</p>
        <div className="mt-3">
          <FeedbackLink />
        </div>
      </section>

      <div className="mt-8 max-w-2xl space-y-8">
        {t.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="text-lg font-bold text-foreground">{section.heading}</h2>
            <div className="mt-2 space-y-3 text-sm leading-relaxed text-muted">
              {section.paragraphs.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </section>
        ))}
      </div>

      <p className="mt-8 text-sm">
        <Link href="/privacy" className="text-muted underline decoration-line underline-offset-2 hover:text-accent">
          {footerT.privacyLink}
        </Link>
      </p>
    </Container>
  );
}
