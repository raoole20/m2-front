import { MeshGradient } from "@m2/ui";
import { getTranslations } from "next-intl/server";

export async function AIHighlight() {
  const t = await getTranslations("landing.ai");

  return (
    <section className="relative mx-6 overflow-hidden rounded-3xl border border-stroke-subtle bg-surface-container/60 px-6 py-14">
      <MeshGradient variant="dusk" />
      <div className="relative mx-auto max-w-4xl">
        <p className="text-xs uppercase tracking-[0.2em] text-text-secondary">{t("eyebrow")}</p>
        <h2 className="mt-3 font-display text-3xl font-extrabold text-text-primary md:text-4xl">
          {t("title")}
        </h2>
        <p className="mt-4 max-w-2xl text-text-secondary">{t("description")}</p>
      </div>
    </section>
  );
}
