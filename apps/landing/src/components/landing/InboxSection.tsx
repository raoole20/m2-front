import { getTranslations } from "next-intl/server";

import type { InboxItem } from "../../../lib/content";
import { InboxDemo } from "./InboxDemo";
import { Reveal } from "./Reveal";

export async function InboxSection() {
  const t = await getTranslations("landing.demo");
  const items = t.raw("items") as InboxItem[];
  const actions = t.raw("actions") as string[];
  const unread = 2;
  const sidebarCount = t("sidebar.countTpl", { total: items.length, unread });

  const strings = {
    sidebarTitle: t("sidebar.title"),
    sidebarCount,
    priority: t("priority"),
    aiDraftLabel: t("aiDraftLabel"),
    aiTagLine: t("aiTagLine"),
    aiDraft: t("aiDraft"),
    draftReady: t("draftReady"),
    edit: t("edit"),
    send: t("send"),
    aiSummary: t("aiSummary"),
    priorityScore: t("priorityScore"),
    suggestedActions: t("suggestedActions"),
    newCustomer: t("newCustomer"),
    aiSummaryBody: t("aiSummaryBody"),
  };

  return (
    <section className="block" id="demo">
      <div className="container">
        <Reveal className="section-head">
          <span className="kicker">{t("kicker")}</span>
          <h2>
            {t("titlePre")}
            <em>{t("titleEm")}</em>
            {t("titleSuf")}
          </h2>
          <p>{t("lede")}</p>
        </Reveal>
        <Reveal>
          <InboxDemo items={items} actions={actions} strings={strings} />
        </Reveal>
      </div>
    </section>
  );
}
