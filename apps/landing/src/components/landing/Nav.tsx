import { getTranslations } from "next-intl/server";

import type { Lang, NavLink } from "../../lib/content";
import { NavShell } from "./NavShell";

type NavProps = {
  locale: Lang;
};

function adminLoginHref(locale: Lang): string {
  return locale === "es" ? "/admin/login" : "/en/admin/login";
}

function adminRegisterHref(locale: Lang): string {
  return locale === "es" ? "/admin/register" : "/en/admin/register";
}

export async function Nav({ locale }: NavProps) {
  const t = await getTranslations("landing.nav");
  const links = t.raw("links") as NavLink[];
  const otherLocale = locale === "es" ? "en" : "es";

  return (
    <NavShell
      homeHref={locale === "es" ? "/" : "/en"}
      otherLangHref={otherLocale === "es" ? "/" : "/en"}
      otherLangLabel={otherLocale.toUpperCase()}
      loginHref={adminLoginHref(locale)}
      loginLabel={t("login")}
      ctaHref={adminRegisterHref(locale)}
      ctaLabel={t("cta")}
      links={links}
    />
  );
}
