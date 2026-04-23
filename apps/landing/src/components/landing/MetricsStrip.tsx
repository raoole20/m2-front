import { getTranslations } from "next-intl/server";

import type { MetricItem } from "../../../lib/content";
import { Reveal } from "./Reveal";

export async function MetricsStrip() {
  const t = await getTranslations("landing.metrics");
  const items = t.raw("items") as MetricItem[];

  return (
    <section className="block" style={{ paddingTop: 80 }}>
      <div className="container">
        <Reveal className="metrics-strip">
          {items.map((m) => (
            <div key={m.label} className="m">
              <div className="big">
                {m.valuePre}
                <em>{m.valueEm}</em>
                {m.valueSuf}
              </div>
              <div className="sub">{m.label}</div>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
