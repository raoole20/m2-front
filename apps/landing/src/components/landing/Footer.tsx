import Link from "next/link";
import { getTranslations } from "next-intl/server";

import type { Lang, NavLink } from "../../../lib/content";
import { Logo } from "../Logo";

type FooterProps = {
  locale: Lang;
};

export async function Footer({ locale }: FooterProps) {
  const t = await getTranslations("landing.footer");
  const productLinks = t.raw("productLinks") as NavLink[];
  const companyLinks = t.raw("companyLinks") as NavLink[];
  const legalLinks = t.raw("legalLinks") as NavLink[];
  const otherLocale = locale === "es" ? "en" : "es";
  const otherHref = otherLocale === "es" ? "/" : "/en";

  return (
    <footer className="foot">
      <div className="container">
        <div className="foot-grid">
          <div className="foot-brand">
            <Link className="logo" aria-label="M2" href={locale === "es" ? "/" : "/en"}>
              <Logo height={28} />
            </Link>
            <p className="tagline">{t("tagline")}</p>
            <Link className="nav-lang" href={otherHref}>
              {otherLocale.toUpperCase()} ↔ {locale.toUpperCase()}
            </Link>
          </div>
          <div className="foot-col">
            <h4>{t("product")}</h4>
            <ul>
              {productLinks.map((l) => (
                <li key={l.label}>
                  <a href={l.href}>{l.label}</a>
                </li>
              ))}
            </ul>
          </div>
          <div className="foot-col">
            <h4>{t("company")}</h4>
            <ul>
              {companyLinks.map((l) => (
                <li key={l.label}>
                  <a href={l.href}>{l.label}</a>
                </li>
              ))}
            </ul>
          </div>
          <div className="foot-col">
            <h4>{t("legal")}</h4>
            <ul>
              {legalLinks.map((l) => (
                <li key={l.label}>
                  <a href={l.href}>{l.label}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="foot-bottom">
          <span>{t("rights")}</span>
          <span className="online">{t("online")}</span>
        </div>
      </div>
    </footer>
  );
}
