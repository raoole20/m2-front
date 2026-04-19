import { FeatureCard } from "@m2/ui";
import { getTranslations } from "next-intl/server";

export async function FeaturesGrid() {
  const t = await getTranslations("landing.features");

  const features = [
    { title: t("f1.title"), description: t("f1.description") },
    { title: t("f2.title"), description: t("f2.description") },
    { title: t("f3.title"), description: t("f3.description") },
    { title: t("f4.title"), description: t("f4.description") },
    { title: t("f5.title"), description: t("f5.description") },
    { title: t("f6.title"), description: t("f6.description") },
  ];

  return (
    <section className="px-6 py-14">
      <div className="mx-auto max-w-6xl">
        <h2 className="mb-6 font-display text-3xl font-extrabold text-text-primary">
          {t("title")}
        </h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {features.map((feature) => (
            <FeatureCard
              key={feature.title}
              description={feature.description}
              title={feature.title}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
