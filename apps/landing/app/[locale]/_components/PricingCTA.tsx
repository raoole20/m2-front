import { getTranslations } from "next-intl/server";

export async function PricingCTA() {
  const t = await getTranslations("landing.pricing");

  return (
    <section className="px-6 py-14">
      <div className="mx-auto max-w-4xl rounded-3xl border border-stroke-subtle bg-surface-container/70 p-8 text-center">
        <h2 className="font-display text-3xl font-extrabold text-text-primary">{t("title")}</h2>
        <p className="mx-auto mt-3 max-w-2xl text-text-secondary">{t("description")}</p>
        <a
          className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-surface shadow-glow-primary"
          href="mailto:contact@motomoto.app?subject=Motomoto%20Pricing"
        >
          {t("cta")}
        </a>
      </div>
    </section>
  );
}
