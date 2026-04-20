import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";

import type { Lang, NavLink } from "../../../lib/content";

type NavProps = {
  locale: Lang;
};

export async function Nav({ locale }: NavProps) {
  const t = await getTranslations("landing.nav");
  const adminBase = process.env.NEXT_PUBLIC_ADMIN_URL || "http://localhost:3002";
  const links = t.raw("links") as NavLink[];
  const otherLocale = locale === "es" ? "en" : "es";
  const otherHref = otherLocale === "es" ? "/" : "/en";

  return (
    <header className="nav">
      <div className="container nav-inner">
        <Link className="logo" href={locale === "es" ? "/" : "/en"}>
          <span className="mark">m</span>M2
        </Link>
        <nav className="nav-links">
          {links.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>
        <div className="nav-right">
          <Link className="nav-lang" href={otherHref}>
            {otherLocale.toUpperCase()}
          </Link>
          <a className="btn btn-primary" href={`${adminBase}/${locale === "es" ? "" : "en/"}admin/login`}>
            {t("login")}
            <ArrowRight size={14} />
          </a>
        </div>
      </div>
    </header>
  );
}
