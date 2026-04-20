import { getTranslations } from "next-intl/server";

import { CHANNEL_COLORS, CHANNEL_ICONS, type ChannelItem } from "../../../lib/content";
import { Reveal } from "./Reveal";

export async function Channels() {
  const t = await getTranslations("landing.channels");
  const items = t.raw("items") as ChannelItem[];

  return (
    <section className="block" id="channels">
      <div className="container">
        <Reveal className="section-head">
          <span className="kicker">[ 01 ] {t("section")}</span>
          <h2>{t("title")}</h2>
          <p>{t("lede")}</p>
        </Reveal>
        <div className="channels-grid">
          {items.map((item, idx) => {
            const Icon = CHANNEL_ICONS[item.key];
            const color = CHANNEL_COLORS[item.key];
            return (
              <Reveal key={item.key} className="channel-card" delay={idx * 60}>
                <div className="top">
                  <span className="icon" style={{ color, background: `${color}26` }}>
                    <Icon size={20} />
                  </span>
                  <h3>{item.name}</h3>
                  <span className="vol">
                    {item.volume} {t("volumeLabel")}
                  </span>
                </div>
                <p className="desc">{item.desc}</p>
                <div className="mini-chat">
                  <div className="mc-label">{t("sampleLabel")}</div>
                  <div className="mc-text">&ldquo;{item.sample}&rdquo;</div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
