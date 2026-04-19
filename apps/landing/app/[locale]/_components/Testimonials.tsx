import { Avatar, GlassCard } from "@m2/ui";
import { getTranslations } from "next-intl/server";

export async function Testimonials() {
  const t = await getTranslations("landing.testimonials");

  const items = [
    { name: t("t1.name"), role: t("t1.role"), quote: t("t1.quote") },
    { name: t("t2.name"), role: t("t2.role"), quote: t("t2.quote") },
  ];

  return (
    <section className="px-6 py-14">
      <div className="mx-auto max-w-6xl">
        <h2 className="mb-6 font-display text-3xl font-extrabold text-text-primary">
          {t("title")}
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((item) => (
            <GlassCard key={item.name} className="space-y-3">
              <div className="flex items-center gap-3">
                <Avatar name={item.name} />
                <div>
                  <p className="font-semibold text-text-primary">{item.name}</p>
                  <p className="text-xs text-text-secondary">{item.role}</p>
                </div>
              </div>
              <p className="text-sm text-text-secondary">{item.quote}</p>
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  );
}
