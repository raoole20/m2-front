import { getTranslations } from "next-intl/server";

import type { PriceTier } from "../../../lib/content";
import { Reveal } from "./Reveal";

export async function Pricing() {
  const t = await getTranslations("landing.pricing");
  const tiers = t.raw("tiers") as PriceTier[];
  const badge = t("mostPopular");

  return (
    <section className="block" id="pricing">
      <div className="container">
        <Reveal className="section-head">
          <span className="kicker">{t("kicker")}</span>
          <h2>
            {t("titlePre")}
            <em>{t("titleEm")}</em>
            {t("titleSuf")}
          </h2>
        </Reveal>
        <div className="pricing">
          {tiers.map((tier, idx) => (
            <Reveal
              key={tier.tier}
              className={`price-card ${tier.featured ? "featured" : ""}`}
              delay={idx * 60}
            >
              {tier.featured ? <span className="ribbon">{badge}</span> : null}
              <span className="tier">{tier.tier}</span>
              <div className="amount">
                {tier.price}
                <span className="per">{tier.per}</span>
              </div>
              <ul>
                {tier.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              <a
                href="#"
                className={`btn ${tier.featured ? "btn-primary" : "btn-ghost"}`}
                style={{ marginTop: "auto", justifyContent: "center" }}
              >
                {tier.cta}
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
