import { getTranslations } from "next-intl/server";

import type { StepItem } from "../../../lib/content";
import { Reveal } from "./Reveal";

export async function HowItWorks() {
  const t = await getTranslations("landing.how");
  const steps = t.raw("steps") as StepItem[];

  return (
    <section className="block" id="how">
      <div className="container">
        <Reveal className="section-head">
          <span className="kicker">[ 03 ] {t("section")}</span>
          <h2>{t("title")}</h2>
        </Reveal>
        <div className="steps">
          {steps.map((step, idx) => (
            <Reveal key={step.n} className="step" delay={idx * 60}>
              <div className="n">{step.n}</div>
              <h3>{step.title}</h3>
              <p>{step.desc}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
