import { GradientButton, MeshGradient } from "@m2/ui";
import { getTranslations } from "next-intl/server";

type HeroProps = {
  locale: "es" | "en";
};

export async function Hero({ locale }: HeroProps) {
  const t = await getTranslations("landing.hero");
  const adminBase = process.env.NEXT_PUBLIC_ADMIN_URL || "http://localhost:3002";

  return (
    <section className="relative overflow-hidden px-6 pb-24 pt-20">
      <MeshGradient variant="primary" />
      <div className="mx-auto max-w-6xl">
        <p className="mb-4 inline-flex rounded-full border border-stroke-subtle bg-surface-container/70 px-3 py-1 text-xs text-text-secondary">
          {t("badge")}
        </p>
        <h1 className="max-w-4xl font-display text-4xl font-extrabold leading-tight text-text-primary md:text-6xl">
          {t("title")}
        </h1>
        <p className="mt-6 max-w-2xl text-base text-text-secondary md:text-lg">{t("subtitle")}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href={`${adminBase}/${locale === "es" ? "" : "en/"}admin/login`}>
            <GradientButton>{t("primaryCta")}</GradientButton>
          </a>
          <a
            className="inline-flex h-11 items-center justify-center rounded-lg border border-stroke-subtle bg-surface-container px-5 text-sm font-medium text-text-primary"
            href="mailto:contact@motomoto.app?subject=Motomoto%20Demo"
          >
            {t("secondaryCta")}
          </a>
        </div>
      </div>
    </section>
  );
}
