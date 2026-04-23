import { getTranslations } from "next-intl/server";

import {
  CHANNEL_BADGE_GRADIENTS,
  CHANNEL_GRADIENTS,
  type InboxItem,
} from "../../lib/content";

function SidebarIcon({ children }: { children: React.ReactNode }) {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2z" />
    </svg>
  );
}

function StackIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export async function AppWindow() {
  const t = await getTranslations("landing.appWindow");
  const items = t.raw("items") as InboxItem[];
  const activeIdx = 1;

  return (
    <div className="hero-visual">
      <div className="app-window">
        <div className="app-titlebar">
          <span className="dot r" />
          <span className="dot y" />
          <span className="dot g" />
          <span className="addr">
            <b>{t("addrPrefix")}</b> / {t("addrSuffix")}
          </span>
        </div>
        <div className="app-body">
          <aside className="app-sidebar">
            <div className="si on" style={{ marginTop: 6 }}>
              <SidebarIcon>
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </SidebarIcon>
            </div>
            <div className="si">
              <SidebarIcon>
                <path d="M3 3v18h18" />
                <path d="M7 14l4-4 4 4 6-6" />
              </SidebarIcon>
            </div>
            <div className="si">
              <SidebarIcon>
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </SidebarIcon>
            </div>
            <div className="si">
              <SidebarIcon>
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </SidebarIcon>
            </div>
            <div className="spc" />
            <div className="si" style={{ marginBottom: 6 }}>
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #9a9bf9, #7677ea)",
                  fontSize: 10,
                  color: "white",
                  display: "grid",
                  placeItems: "center",
                  fontWeight: 700,
                }}
              >
                A
              </div>
            </div>
          </aside>

          <div className="app-inbox">
            <div className="title">
              {t("inboxTitle")}
              <span className="n">12</span>
            </div>
            {items.slice(0, 5).map((it, i) => (
              <div key={i} className={`it ${i === activeIdx ? "on" : ""}`}>
                <div
                  className={`av ${channelShort(it.channel)}`}
                  style={{ background: CHANNEL_GRADIENTS[it.channel] }}
                >
                  {it.initials}
                </div>
                <div>
                  <div className="n">{it.name}</div>
                  <div className="p">{it.preview}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="app-thread">
            <div className="t-head">
              <span className="dot" />
              <b>{t("threadContact")}</b>
              <span>· {t("threadChannel")}</span>
              <span style={{ flex: 1 }} />
              <span>{t("online")}</span>
            </div>
            <div className="msg in">
              <span className="tag">{t("threadChannel")}</span>
              {t("threadIncoming1")}
            </div>
            <div className="msg ai">
              <span className="tag">{t("threadAiLabel")}</span>
              {t("threadAi")}
            </div>
            <div className="msg in">
              <span className="tag">{t("threadChannel")}</span>
              {t("threadIncoming2")}
            </div>
            <div className="typing">
              <span />
              <span />
              <span />
            </div>
          </div>
        </div>
      </div>

      <div className="fcard f1">
        <div className="ic" style={{ background: CHANNEL_BADGE_GRADIENTS.whatsapp }}>
          <PhoneIcon />
        </div>
        <div>
          <div className="lbl">{t("floatResponseLabel")}</div>
          <div className="val">{t("floatResponseValue")}</div>
        </div>
      </div>
      <div className="fcard f2">
        <div className="ic" style={{ background: "linear-gradient(135deg, #a78bfa, #6d28d9)" }}>
          <StackIcon />
        </div>
        <div>
          <div className="lbl">{t("floatConversationsLabel")}</div>
          <div className="val">{t("floatConversationsValue")}</div>
        </div>
      </div>
      <div className="fcard f3">
        <div className="ic" style={{ background: "linear-gradient(135deg, #34d399, #059669)" }}>
          <CheckIcon />
        </div>
        <div>
          <div className="lbl">{t("floatResolvedLabel")}</div>
          <div className="val">{t("floatResolvedValue")}</div>
        </div>
      </div>

      <div className="hero-metric">
        <div className="n">{t("heroMetricValue")}</div>
        <div className="l">{t("heroMetricLabel")}</div>
      </div>
    </div>
  );
}

function channelShort(key: string): string {
  if (key === "whatsapp") return "wa";
  if (key === "instagram") return "ig";
  if (key === "telegram") return "tg";
  return "em";
}
