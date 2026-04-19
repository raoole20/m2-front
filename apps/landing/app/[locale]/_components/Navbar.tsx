import Link from "next/link";
import { getTranslations } from "next-intl/server";

type NavbarProps = {
  locale: "es" | "en";
};

export async function Navbar({ locale }: NavbarProps) {
  const t = await getTranslations("landing.nav");
  const adminBase = process.env.NEXT_PUBLIC_ADMIN_URL || "http://localhost:3002";

  return (
    <header className="sticky top-0 z-30 border-b border-stroke-subtle/60 bg-surface/70 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <Link
          className="font-display text-xl font-bold text-text-primary"
          href={locale === "es" ? "/" : "/en"}
        >
          m2
        </Link>

        <div className="flex items-center gap-3">
          <Link
            className="rounded-full border border-stroke-subtle px-3 py-1 text-xs text-text-secondary hover:text-text-primary"
            href={locale === "es" ? "/en" : "/"}
          >
            {locale === "es" ? "EN" : "ES"}
          </Link>
          <a
            className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-surface shadow-glow-primary"
            href={`${adminBase}/${locale === "es" ? "" : "en/"}admin/login`}
          >
            {t("login")}
          </a>
        </div>
      </div>
    </header>
  );
}
