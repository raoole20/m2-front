import { ArrowRight, Check } from "lucide-react";
import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";

import type { Bubble, Lang } from "../../../lib/content";
import { ChatStage } from "./ChatStage";
import { Reveal } from "./Reveal";

type HeroProps = {
  locale: Lang;
};

function renderTitle(title: string, keywords: string[]): ReactNode {
  const lines = title.split("\n");
  return lines.map((line, lineIdx) => {
    let remaining = line;
    const parts: ReactNode[] = [];
    let safety = 0;
    while (remaining.length > 0 && safety < 20) {
      safety += 1;
      const match = keywords
        .map((kw) => ({ kw, idx: remaining.indexOf(kw) }))
        .filter((m) => m.idx !== -1)
        .sort((a, b) => a.idx - b.idx)[0];
      if (!match) {
        parts.push(remaining);
        break;
      }
      if (match.idx > 0) parts.push(remaining.slice(0, match.idx));
      parts.push(<em key={`${lineIdx}-${parts.length}`}>{match.kw}</em>);
      remaining = remaining.slice(match.idx + match.kw.length);
    }
    return <div key={lineIdx}>{parts}</div>;
  });
}

export async function Hero({ locale }: HeroProps) {
  const t = await getTranslations("landing.hero");
  const tChat = await getTranslations("landing.chatStage");
  const keywords = t.raw("highlightKeywords") as string[];
  const streams = tChat.raw("streams") as Bubble[][];

  return (
    <section className="hero">
      <div className="container">
        <div className="hero-grid">
          <div>
            <Reveal className="kicker-chip">
              <span className="ai-dot" />
              {t("kicker")}
            </Reveal>
            <Reveal as="h1" delay={60}>
              {renderTitle(t("title"), keywords)}
            </Reveal>
            <Reveal as="p" className="lede" delay={120}>
              {t("subtitle")}
            </Reveal>
            <Reveal className="cta-row" delay={180}>
              <a href="#pricing" className="btn btn-primary">
                {t("cta1")}
                <ArrowRight size={14} />
              </a>
              <a href="#demo" className="btn btn-ghost">
                {t("cta2")}
              </a>
            </Reveal>
            <Reveal className="trust-row" delay={240}>
              <span>
                <Check size={12} /> {t("trial14")}
              </span>
              <span>
                <Check size={12} /> {t("noCard")}
              </span>
              <span>
                <Check size={12} /> {t("setup3")}
              </span>
            </Reveal>
          </div>
          <Reveal delay={200}>
            <ChatStage streams={streams} />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
