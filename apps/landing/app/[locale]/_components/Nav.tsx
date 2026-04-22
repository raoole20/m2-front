import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";

import type { Lang, NavLink } from "../../../lib/content";
import { Logo } from "./Logo";

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
        <Link className="logo" aria-label="M2" href={locale === "es" ? "/" : "/en"}>
          <Logo height={28} />
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
          <Link className="nav-login" href={adminLoginHref(locale)}>
            {t("login")}
          </Link>
          <Link className="btn btn-primary" href={adminLoginHref(locale)}>
            {t("cta")}
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </header>
  );
}
