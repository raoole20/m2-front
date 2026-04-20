import { ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";

import type { Lang } from "../../../lib/content";
import { Reveal } from "./Reveal";

type FinalCTAProps = {
  locale: Lang;
};

export async function FinalCTA({ locale }: FinalCTAProps) {
  const t = await getTranslations("landing.finalCta");
  const adminBase = process.env.NEXT_PUBLIC_ADMIN_URL || "http://localhost:3002";

  return (
    <section className="block">
      <div className="container">
        <Reveal className="cta-block">
          <h2>
            {t("titlePre")} <em>{t("titleHighlight")}</em>
          </h2>
          <p>{t("subtitle")}</p>
          <div className="cta-row">
            <a
              className="btn btn-primary"
              href={`${adminBase}/${locale === "es" ? "" : "en/"}admin/login`}
            >
              {t("primary")}
              <ArrowRight size={14} />
            </a>
            <a className="btn btn-ghost" href="mailto:contact@motomoto.app?subject=M2%20Sales">
              {t("secondary")}
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
