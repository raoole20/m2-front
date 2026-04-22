import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";

import type { Lang, NavLink } from "../../../lib/content";

type NavProps = {
  locale: Lang;
};

function adminLoginHref(locale: Lang): string {
  return locale === "es" ? "/admin/login" : "/en/admin/login";
}

export async function Nav({ locale }: NavProps) {
  const t = await getTranslations("landing.nav");
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
          <Link className="btn btn-primary" href={adminLoginHref(locale)}>
            {t("login")}
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </header>
  );
}
