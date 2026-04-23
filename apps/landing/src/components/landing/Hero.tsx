import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";

import { TRUST_AVATAR_GRADIENTS, type Lang } from "../../../lib/content";
import { AppWindow } from "./AppWindow";
import { Reveal } from "./Reveal";

type HeroProps = {
  locale: Lang;
};

const TRUST_AVATAR_LABELS = ["MR", "DH", "SC", "JL", "AM"];

function PlayIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

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
    return (
      <div key={lineIdx}>
        {parts}
        {lineIdx < lines.length - 1 ? null : null}
      </div>
    );
  });
}

export async function Hero({ locale: _locale }: HeroProps) {
  const t = await getTranslations("landing.hero");
  const keywords = t.raw("highlightKeywords") as string[];

  return (
    <section className="hero">
      <div className="container">
        <div className="hero-grid">
          <div>
            <Reveal className="kicker-chip">
              <span className="pulse" />
              {t("kicker")}
            </Reveal>
            <Reveal as="h1" delay={60}>
              {renderTitle(t("title"), keywords)}
            </Reveal>
            <Reveal as="p" className="lede" delay={140}>
              {t("subtitle")}
            </Reveal>
            <Reveal className="cta-row" delay={220}>
              <a href="#pricing" className="btn btn-primary">
                {t("cta1")}
                <ArrowIcon />
              </a>
              <a href="#demo" className="btn btn-ghost">
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <PlayIcon />
                  {t("cta2")}
                </span>
              </a>
            </Reveal>
            <Reveal className="trust-inline" delay={300}>
              <div className="avatars">
                {TRUST_AVATAR_LABELS.map((label, i) => (
                  <span key={label} style={{ background: TRUST_AVATAR_GRADIENTS[i] }}>
                    {label}
                  </span>
                ))}
              </div>
              <div>
                <div className="stars">★★★★★</div>
                <div className="txt">
                  <b>{t("trustRating")}</b> · {t("trustText")}
                </div>
              </div>
            </Reveal>
          </div>
          <Reveal delay={200}>
            <AppWindow />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
