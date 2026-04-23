import type { CSSProperties } from "react";
import { getTranslations } from "next-intl/server";

import {
  CHANNEL_BADGE_GRADIENTS,
  CHANNEL_COLORS,
  CHANNEL_ICONS,
  type ChannelBadge,
  type ChannelItem,
} from "../../lib/content";
import { DotGlobe } from "./DotGlobe";
import { Reveal } from "./Reveal";

function parseStyle(style: string): CSSProperties {
  const out: CSSProperties = {};
  for (const pair of style.split(";")) {
    const [k, v] = pair.split(":");
    if (!k || !v) continue;
    const key = k.trim() as keyof CSSProperties;
    // biome-ignore lint: dynamic CSS keys from translations
    (out as Record<string, string>)[key as string] = v.trim();
  }
  return out;
}

export async function Channels() {
  const t = await getTranslations("landing.channels");
  const items = t.raw("items") as ChannelItem[];
  const badges = t.raw("badges") as ChannelBadge[];

  return (
    <section className="block" id="channels">
      <div className="container">
        <Reveal className="section-head center">
          <span className="kicker">{t("kicker")}</span>
          <h2>
            {t("titlePre")}
            <em>{t("titleEm")}</em>
            {t("titleSuf")}
          </h2>
          <p style={{ marginLeft: "auto", marginRight: "auto" }}>{t("lede")}</p>
        </Reveal>

        <Reveal className="globe-wrap">
          <DotGlobe />
          {badges.map((b) => {
            const Icon = CHANNEL_ICONS[b.key];
            return (
              <div key={b.key} className="globe-badge" style={parseStyle(b.style)}>
                <div className="ic" style={{ background: CHANNEL_BADGE_GRADIENTS[b.key] }}>
                  <Icon size={12} />
                </div>
                <span>{b.name}</span>
                <span className="msg">· {b.region}</span>
              </div>
            );
          })}
        </Reveal>

        <div className="channels-grid">
          {items.map((item, idx) => {
            const Icon = CHANNEL_ICONS[item.key];
            const color = CHANNEL_COLORS[item.key];
            return (
              <Reveal key={item.key} className="channel-card" delay={idx * 60}>
                <div className="icon" style={{ color, background: `${color}1f` }}>
                  <Icon size={20} />
                </div>
                <h3>{item.name}</h3>
                <p>{item.desc}</p>
                <div className="mini-chat">
                  <span>{item.sample}</span>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
