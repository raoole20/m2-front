import { getTranslations } from "next-intl/server";

import {
  TESTIMONIAL_AVATAR_GRADIENTS,
  type TestimonialItem,
} from "../../lib/content";
import { Reveal } from "./Reveal";

export async function Testimonials() {
  const t = await getTranslations("landing.testimonials");
  const items = t.raw("items") as TestimonialItem[];

  return (
    <section className="block">
      <div className="container">
        <Reveal className="section-head">
          <span className="kicker">{t("kicker")}</span>
          <h2>
            {t("titlePre")}
            <em>{t("titleEm")}</em>
            {t("titleSuf")}
          </h2>
        </Reveal>
        <div className="testimonials">
          {items.map((item, i) => (
            <Reveal
              key={item.name}
              className={`testim ${item.featured ? "feat" : ""}`}
              delay={i * 80}
            >
              <div className="quote-mark">&ldquo;</div>
              <p className="quote">{item.quote}</p>
              <div className="who">
                <div
                  className="av"
                  style={{ background: TESTIMONIAL_AVATAR_GRADIENTS[item.avatar] }}
                >
                  {item.initials}
                </div>
                <div>
                  <div className="name">{item.name}</div>
                  <div className="role">{item.role}</div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
