import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";

import type { Lang } from "../../../lib/content";
import { Reveal } from "./Reveal";

type FinalCTAProps = {
  locale: Lang;
};

function adminLoginHref(locale: Lang): string {
  return locale === "es" ? "/admin/login" : "/en/admin/login";
}

export async function FinalCTA({ locale }: FinalCTAProps) {
  const t = await getTranslations("landing.finalCta");

  return (
    <section className="block">
      <div className="container">
        <Reveal className="cta-block">
          <h2>
            {t("titlePre")}
            <em>{t("titleEm")}</em>
            {t("titleSuf")}
          </h2>
          <p>{t("subtitle")}</p>
          <div className="cta-row">
            <Link className="btn btn-primary" href={adminLoginHref(locale)}>
              {t("primary")}
              <ArrowRight size={14} />
            </Link>
            <a className="btn btn-ghost" href="mailto:contact@motomoto.app?subject=M2%20Sales">
              {t("secondary")}
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
