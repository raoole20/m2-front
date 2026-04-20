import { getTranslations } from "next-intl/server";

import type { ChannelSummary, InboxItem } from "../../../lib/content";
import { InboxDemo } from "./InboxDemo";
import { Reveal } from "./Reveal";

export async function InboxSection() {
  const t = await getTranslations("landing.demo");
  const items = t.raw("items") as InboxItem[];
  const channelSummary = t.raw("channelSummary") as ChannelSummary[];
  const actions = t.raw("actions") as string[];

  const strings = {
    tabInbox: t("tabs.inbox"),
    tabAutomations: t("tabs.automations"),
    tabAnalytics: t("tabs.analytics"),
    sidebarTitle: t("sidebar.title"),
    unread: t("sidebar.unread"),
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
          <span className="kicker">[ 02 ] {t("section")}</span>
          <h2>{t("title")}</h2>
          <p>{t("lede")}</p>
        </Reveal>
        <Reveal>
          <InboxDemo
            items={items}
            channelSummary={channelSummary}
            actions={actions}
            strings={strings}
          />
        </Reveal>
      </div>
    </section>
  );
}
