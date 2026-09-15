import { Container } from "@/components/Container";
import { getLang } from "@/lib/i18n/lang";
import { getDict } from "@/lib/i18n/dict";

export default async function PrivacyPage() {
  const lang = await getLang();
  const t = getDict(lang).privacy;

  return (
    <Container as="main" className="py-10">
      <h1 className="text-2xl font-bold text-foreground">{t.title}</h1>
      <p className="mt-2 text-xs text-muted">{t.lastUpdated}</p>

      <div className="mt-8 max-w-2xl space-y-8">
        {t.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="text-lg font-bold text-foreground">{section.heading}</h2>
            <div className="mt-2 space-y-2 text-sm leading-relaxed text-muted">
              {section.paragraphs.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </Container>
  );
}
