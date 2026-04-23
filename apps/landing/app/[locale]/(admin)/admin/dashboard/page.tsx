"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { AppIcon } from "../../../../../src/components/m2/AppIcon";
import { AppShell } from "../../../../../src/components/m2/AppShell";
import { CONVERSATIONS } from "../../../../../src/components/m2/mock-data";

type Segment = { label: string; v: number; col: string };

const SEGMENTS: Segment[] = [
  { label: "WhatsApp", v: 60, col: "#25d366" },
  { label: "Instagram", v: 25, col: "#e1306c" },
  { label: "Telegram", v: 8, col: "#29b6f6" },
  { label: "Email", v: 7, col: "#a78bfa" },
];

const R = 58;
const C = 2 * Math.PI * R;

const FEED: { who: string; action: string; t: string; col: string }[] = [
  { who: "Laura G.", action: "se marcó lead caliente", t: "2m", col: "#25d366" },
  { who: "M2 AI", action: "resolvió 8 FAQs de horarios", t: "12m", col: "#f59e0b" },
  { who: "Carlos R.", action: "escalado a Diego", t: "24m", col: "#29b6f6" },
  { who: "ana@acme.co", action: "pidió propuesta", t: "1h", col: "#a78bfa" },
  { who: "Jorge L.", action: "cotización enviada", t: "2h", col: "#25d366" },
  { who: "M2 AI", action: "promo del 20% aplicada a 4 chats", t: "3h", col: "#f59e0b" },
];

export default function DashboardPage() {
  const pathname = usePathname() ?? "";
  const locale = pathname.startsWith("/en") ? "en" : "es";
  const base = locale === "es" ? "/admin" : "/en/admin";

  let offset = 0;

  return (
    <AppShell>
      <div className="page">
        <div className="dash-hero">
          <div>
            <div className="greet">Martes · 14 de abril · 14:32</div>
            <h1 className="hero-title">
              Hoy M2 atendió <em>127 conversaciones</em> por ti.
              <br />
              De ellas, <em>24 son leads calientes</em> que vale la pena mirar.
            </h1>
            <div style={{ display: "flex", gap: 10 }}>
              <Link href={`${base}/inbox`} className="btn btn-primary">
                Ver leads calientes <AppIcon name="arrow-right" size={14} />
              </Link>
              <Link href={`${base}/inbox`} className="btn btn-ghost">
                Abrir bandeja
              </Link>
            </div>
            <div className="hero-stat">
              <div className="hs">
                <span className="n">13.6k</span>
                <span className="l">Mensajes / semana</span>
              </div>
              <div className="hs">
                <span className="n">94%</span>
                <span className="l">Auto-respondidos</span>
              </div>
              <div className="hs">
                <span className="n">3.2s</span>
                <span className="l">Tiempo promedio</span>
              </div>
              <div className="hs">
                <span className="n">28%</span>
                <span className="l">Conversión</span>
              </div>
            </div>
          </div>

          <div className="donut-wrap">
            <svg width="160" height="160" viewBox="0 0 160 160">
              <circle cx="80" cy="80" r={R} fill="none" stroke="var(--panel-3)" strokeWidth="18" />
              {SEGMENTS.map((s, i) => {
                const len = (s.v / 100) * C;
                const gap = C - len;
                const el = (
                  <circle
                    key={i}
                    cx="80"
                    cy="80"
                    r={R}
                    fill="none"
                    stroke={s.col}
                    strokeWidth="18"
                    strokeDasharray={`${len} ${gap}`}
                    strokeDashoffset={-offset}
                    transform="rotate(-90 80 80)"
                    strokeLinecap="butt"
                  />
                );
                offset += len;
                return el;
              })}
              <text x="80" y="78" textAnchor="middle" fill="var(--text)" fontSize="22" fontWeight="600" letterSpacing="-0.02em">
                13.6k
              </text>
              <text x="80" y="96" textAnchor="middle" fill="var(--text-dim)" fontSize="9.5" fontFamily="var(--font-mono)" letterSpacing=".1em">
                MENSAJES
              </text>
            </svg>
            <div className="donut-legend">
              {SEGMENTS.map((s, i) => (
                <div key={i} className="dl-row">
                  <span className="sw" style={{ background: s.col }} />
                  <span>{s.label}</span>
                  <span className="n">{s.v}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="kpi-grid">
          <div className="kpi">
            <div className="kpi-label">
              <AppIcon name="inbox" size={11} /> Mensajes hoy
            </div>
            <div className="kpi-value">1,948</div>
            <div className="kpi-delta up">
              <AppIcon name="trending-up" size={12} /> +12% vs ayer
            </div>
          </div>
          <div className="kpi">
            <div className="kpi-label">
              <AppIcon name="clock" size={11} /> Tiempo de respuesta
            </div>
            <div className="kpi-value">
              3.2<span className="unit">s</span>
            </div>
            <div className="kpi-delta up">
              <AppIcon name="trending-up" size={12} /> -0.8s
            </div>
          </div>
          <div className="kpi">
            <div className="kpi-label">
              <AppIcon name="flame" size={11} /> Leads calientes hoy
            </div>
            <div className="kpi-value">24</div>
            <div className="kpi-delta up">
              <AppIcon name="trending-up" size={12} /> +6
            </div>
          </div>
          <div className="kpi">
            <div className="kpi-label">
              <AppIcon name="user-plus" size={11} /> Necesitan humano
            </div>
            <div className="kpi-value">7</div>
            <div className="kpi-delta down">
              <AppIcon name="alert" size={12} /> 2 urgentes
            </div>
          </div>
        </div>

        <div className="dash-grid">
          <div className="panel" style={{ padding: 20 }}>
            <div className="panel-head" style={{ border: "none", padding: 0, marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>Cola de atención · prioridad alta</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>M2 sugiere abrir primero</div>
              </div>
              <Link href={`${base}/inbox`} className="btn btn-subtle btn-sm">
                Ver todas
              </Link>
            </div>
            {CONVERSATIONS.slice(0, 4).map((c) => (
              <Link
                key={c.id}
                href={`${base}/inbox?c=${c.id}`}
                className="queue-item"
                style={{ padding: "12px 14px", marginBottom: 10, textDecoration: "none", color: "var(--text)" }}
              >
                <div className="qi-ava" style={{ background: c.avaBg, width: 36, height: 36 }}>
                  {c.init}
                </div>
                <div className="qi-body">
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <b style={{ fontSize: 13.5 }}>{c.name}</b>
                    <span className="ch-dot" style={{ background: c.col }} />
                    <span style={{ fontSize: 11, color: "var(--text-dim)", fontFamily: "var(--font-mono)" }}>{c.chLabel}</span>
                    {c.tags[0] && <span className={`badge badge-${c.tags[0].color}`}>{c.tags[0].label}</span>}
                  </div>
                  <div
                    style={{
                      fontSize: 12.5,
                      color: "var(--text-muted)",
                      marginTop: 3,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {c.prev}
                  </div>
                </div>
                <div className="qi-meta">{c.time}</div>
              </Link>
            ))}
          </div>

          <div className="panel" style={{ padding: 18 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Feed</div>
            {FEED.map((a, i) => (
              <div key={i} className="feed-item">
                <div className="fi-ava" style={{ background: `linear-gradient(135deg, ${a.col}, ${a.col}aa)` }}>
                  {a.who[0]}
                </div>
                <div className="fi-body">
                  <div className="txt">
                    <b>{a.who}</b> {a.action}
                  </div>
                  <div className="meta">hace {a.t}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
