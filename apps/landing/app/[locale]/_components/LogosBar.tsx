import { getTranslations } from "next-intl/server";

import type { LogoItem } from "../../../lib/content";
import { LogosCarousel } from "./LogosCarousel";

export async function LogosBar() {
  const t = await getTranslations("landing.logos");
  const items = t.raw("items") as LogoItem[];

  return (
    <div className="logos">
      <LogosCarousel items={items} />
    </div>
  );
}
