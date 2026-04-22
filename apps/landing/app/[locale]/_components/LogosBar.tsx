import { getTranslations } from "next-intl/server";

import type { LogoItem } from "../../../lib/content";
import { Reveal } from "./Reveal";

export async function LogosBar() {
  const t = await getTranslations("landing.logos");
  const items = t.raw("items") as LogoItem[];

  return (
    <div className="container">
      <Reveal className="logos">
        <div className="logos-label">{t("label")}</div>
        <div className="logos-grid">
          {items.map((item) => (
            <div key={item.text} className={`lg ${item.sans ? "sans" : ""}`}>
              {item.text}
            </div>
          ))}
        </div>
      </Reveal>
    </div>
  );
}
