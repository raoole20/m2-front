import { getTranslations } from "next-intl/server";

type FooterProps = {
  locale: "es" | "en";
};

export async function Footer({ locale }: FooterProps) {
  const t = await getTranslations("landing.footer");
  const year = new Date().getFullYear();

  return (
    <footer className="mt-24 border-t border-stroke-subtle/60 px-6 py-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 text-sm text-text-secondary md:flex-row md:items-center md:justify-between">
        <p>m2 · {t("tagline")}</p>
        <div className="flex items-center gap-4">
          <a className="hover:text-text-primary" href="mailto:contact@motomoto.app">
            {t("contact")}
          </a>
          <a className="hover:text-text-primary" href={locale === "es" ? "/" : "/en"}>
            {t("home")}
          </a>
        </div>
        <p>{t("copyright", { year })}</p>
      </div>
    </footer>
  );
}
