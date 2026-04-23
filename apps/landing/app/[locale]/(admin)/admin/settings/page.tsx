"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";

import { AppIcon } from "../../../../src/components/m2/AppIcon";
import { AppShell } from "../../../../src/components/m2/AppShell";

type TabKey =
  | "profile"
  | "workspace"
  | "team"
  | "channels"
  | "ai"
  | "automations"
  | "billing"
  | "security"
  | "notifications";

const GROUP_LABEL_STYLE = {
  fontFamily: "var(--font-mono)",
  fontSize: 10.5,
  color: "var(--text-dim)",
  textTransform: "uppercase" as const,
  letterSpacing: ".08em",
  padding: "4px 12px 6px",
};

const GROUP_LABEL_STYLE_MID = { ...GROUP_LABEL_STYLE, padding: "12px 12px 6px" };

type TabLink = { k: TabKey; label: string; i: string };

const GROUPS: { label: string; style?: typeof GROUP_LABEL_STYLE; items: TabLink[] }[] = [
  {
    label: "Cuenta",
    items: [
      { k: "profile", label: "Perfil", i: "user" },
      { k: "workspace", label: "Workspace", i: "building" },
      { k: "team", label: "Equipo", i: "users" },
    ],
  },
  {
    label: "Canales & IA",
    style: GROUP_LABEL_STYLE_MID,
    items: [
      { k: "channels", label: "Canales", i: "inbox" },
      { k: "ai", label: "Configuración IA", i: "bot" },
      { k: "automations", label: "Automatizaciones", i: "bolt" },
    ],
  },
  {
    label: "Otros",
    style: GROUP_LABEL_STYLE_MID,
    items: [
      { k: "billing", label: "Facturación", i: "target" },
      { k: "security", label: "Seguridad", i: "shield" },
      { k: "notifications", label: "Notificaciones", i: "bell" },
    ],
  },
];

function Switch({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <div
      className={`ai-toggle ${on ? "on" : ""}`}
      onClick={onChange}
      style={{ padding: 0, border: "none", background: "transparent" }}
    >
      <div className="ai-switch" style={{ width: 32, height: 18 }} />
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const locale = pathname.startsWith("/en") ? "en" : "es";
  const base = locale === "es" ? "/admin" : "/en/admin";

  const [tab, setTab] = useState<TabKey>("profile");
  const [aiAuto, setAiAuto] = useState(true);
  const [notif, setNotif] = useState(true);

  const onLogout = () => router.push(`${base}/login`);

  return (
    <AppShell>
      <div className="settings-shell">
        <nav className="settings-nav">
          {GROUPS.map((g, gi) => (
            <div key={gi}>
              <div style={g.style ?? GROUP_LABEL_STYLE}>{g.label}</div>
              {g.items.map((t) => (
                <a
                  key={t.k}
                  className={tab === t.k ? "on" : ""}
                  onClick={() => setTab(t.k)}
                  style={{ display: "flex", alignItems: "center", gap: 10 }}
                >
                  <AppIcon name={t.i} size={14} /> {t.label}
                </a>
              ))}
            </div>
          ))}
          <a
            style={{ display: "flex", alignItems: "center", gap: 10, color: "#fca5a5", marginTop: 14 }}
            onClick={onLogout}
          >
            <AppIcon name="log-out" size={14} /> Cerrar sesión
          </a>
        </nav>

        <div>
          <div className="page-head" style={{ marginBottom: 18 }}>
            <div>
              <h1 className="page-title">Settings</h1>
              <div className="page-sub">Gestiona tu cuenta, canales y la IA</div>
            </div>
          </div>

          {tab === "profile" && <ProfileTab aiAuto={aiAuto} setAiAuto={setAiAuto} notif={notif} setNotif={setNotif} />}
          {tab === "channels" && <ChannelsTab />}
          {tab === "ai" && <AITab />}
          {tab === "billing" && <BillingTab />}
          {tab === "security" && <SecurityTab />}
          {tab === "team" && <TeamTab />}
          {(tab === "workspace" || tab === "notifications" || tab === "automations") && <PlaceholderTab name={tab} />}
        </div>
      </div>
    </AppShell>
  );
}

function ProfileTab({
  aiAuto,
  setAiAuto,
  notif,
  setNotif,
}: {
  aiAuto: boolean;
  setAiAuto: (v: boolean) => void;
  notif: boolean;
  setNotif: (v: boolean) => void;
}) {
  return (
    <>
      <div className="settings-section">
        <h3>Perfil</h3>
        <div className="ss-sub">Cómo te ve tu equipo y tus clientes</div>

        <div className="settings-row">
          <div>
            <div className="sr-label">Avatar</div>
            <div className="sr-hint">JPG o PNG, 400x400 mín</div>
          </div>
          <div className="sr-control">
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: "linear-gradient(135deg,#f59e0b,#ec4899)",
                display: "grid",
                placeItems: "center",
                fontSize: 20,
                fontWeight: 700,
                color: "white",
              }}
            >
              A
            </div>
            <button type="button" className="btn btn-subtle btn-sm">
              Cambiar
            </button>
          </div>
        </div>

        <div className="settings-row">
          <div className="sr-label">Nombre</div>
          <div className="sr-control" style={{ width: "100%" }}>
            <input className="input" defaultValue="Andrea Castillo" style={{ maxWidth: 320 }} />
          </div>
        </div>

        <div className="settings-row">
          <div className="sr-label">Email</div>
          <div className="sr-control" style={{ width: "100%" }}>
            <input className="input" defaultValue="andrea@milacafe.mx" style={{ maxWidth: 320 }} />
            <span className="badge badge-green">Verificado</span>
          </div>
        </div>

        <div className="settings-row">
          <div className="sr-label">Rol</div>
          <div className="sr-control">
            <span className="badge badge-amber">Admin</span>
            <span style={{ fontSize: 12, color: "var(--text-dim)" }}>Acceso completo al workspace</span>
          </div>
        </div>

        <div className="settings-row">
          <div className="sr-label">Idioma</div>
          <div className="sr-control">
            <select className="input" style={{ maxWidth: 200 }} defaultValue="es">
              <option value="es">Español (México)</option>
              <option value="en">English (US)</option>
              <option value="pt">Português (BR)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="settings-section">
        <h3>Preferencias</h3>
        <div className="ss-sub">Personaliza tu experiencia</div>

        <div className="settings-row">
          <div>
            <div className="sr-label">IA asistente por defecto</div>
            <div className="sr-hint">M2 responde automáticamente las conversaciones entrantes</div>
          </div>
          <div className="sr-control">
            <Switch on={aiAuto} onChange={() => setAiAuto(!aiAuto)} />
          </div>
        </div>

        <div className="settings-row">
          <div>
            <div className="sr-label">Notificaciones en escritorio</div>
            <div className="sr-hint">Avisos cuando se escale un chat</div>
          </div>
          <div className="sr-control">
            <Switch on={notif} onChange={() => setNotif(!notif)} />
          </div>
        </div>

        <div className="settings-row">
          <div>
            <div className="sr-label">Horario de trabajo</div>
            <div className="sr-hint">Fuera de este rango, M2 avisa que respondes mañana</div>
          </div>
          <div className="sr-control">
            <input className="input" defaultValue="09:00" style={{ width: 90 }} />
            <span style={{ color: "var(--text-dim)" }}>→</span>
            <input className="input" defaultValue="18:00" style={{ width: 90 }} />
          </div>
        </div>
      </div>

      <div className="settings-section" style={{ borderColor: "rgba(239,68,68,.2)" }}>
        <h3 style={{ color: "#fca5a5" }}>Zona peligrosa</h3>
        <div className="ss-sub">Acciones irreversibles</div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            style={{ color: "#fca5a5", borderColor: "rgba(239,68,68,.3)" }}
          >
            Eliminar cuenta
          </button>
          <button type="button" className="btn btn-ghost btn-sm">
            Exportar mis datos
          </button>
        </div>
      </div>
    </>
  );
}

function ChannelsTab() {
  const channels: { k: "wa" | "ig" | "tg" | "em"; name: string; status: string; account: string; statusColor: "green" | "amber"; i: string }[] = [
    { k: "wa", name: "WhatsApp Business", status: "Conectado", account: "+52 81 1234 5678 · Mila Café", statusColor: "green", i: "whatsapp" },
    { k: "ig", name: "Instagram DM", status: "Conectado", account: "@milacafe.mx", statusColor: "green", i: "instagram" },
    { k: "tg", name: "Telegram", status: "Conectado", account: "@milacafe_bot", statusColor: "green", i: "telegram" },
    { k: "em", name: "Email", status: "Requiere verificación", account: "hola@milacafe.mx", statusColor: "amber", i: "mail" },
  ];

  return (
    <div className="settings-section">
      <h3>Canales conectados</h3>
      <div className="ss-sub">Conecta más canales o gestiona los existentes</div>

      {channels.map((c) => (
        <div key={c.k} className="settings-row" style={{ gridTemplateColumns: "auto 1fr auto" }}>
          <div className="ch-option on" style={{ padding: 0, border: "none", background: "transparent", width: "auto" }}>
            <div className={`ch-icon ${c.k}`}>
              <AppIcon name={c.i} size={20} />
            </div>
          </div>
          <div>
            <div className="sr-label" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {c.name}
              <span className={`badge badge-${c.statusColor}`}>{c.status}</span>
            </div>
            <div className="sr-hint">{c.account}</div>
          </div>
          <div className="sr-control">
            <button type="button" className="btn btn-subtle btn-sm">
              Configurar
            </button>
            <button type="button" className="btn-icon">
              <AppIcon name="more" size={16} />
            </button>
          </div>
        </div>
      ))}

      <div style={{ marginTop: 14, padding: 14, border: "1px dashed var(--border-2)", borderRadius: 10, textAlign: "center" }}>
        <button type="button" className="btn btn-subtle btn-sm">
          <AppIcon name="plus" size={12} /> Conectar nuevo canal
        </button>
      </div>
    </div>
  );
}

function AITab() {
  const tones = ["Cercano", "Profesional", "Casual", "Divertido"];
  const escalations = ["Cliente enojado o frustrado", "Pregunta sobre facturas/pagos", "Cancelación o reembolso", "Pregunta fuera de alcance"];
  const sources: { n: string; c: string; t: string }[] = [
    { n: "FAQ general", c: "24 preguntas", t: "actualizado hace 3d" },
    { n: "Catálogo de productos", c: "48 items", t: "sincronizado hace 1h" },
    { n: "Horarios y ubicaciones", c: "3 sucursales", t: "actualizado hace 1 sem" },
  ];

  return (
    <>
      <div className="settings-section">
        <h3>Configuración de IA</h3>
        <div className="ss-sub">Cómo responde M2 en tu nombre</div>

        <div className="settings-row">
          <div>
            <div className="sr-label">Tono de voz</div>
            <div className="sr-hint">M2 adapta sus respuestas a este estilo</div>
          </div>
          <div className="sr-control">
            <div style={{ display: "flex", gap: 6 }}>
              {tones.map((t, i) => (
                <button
                  key={t}
                  type="button"
                  className="btn btn-sm"
                  style={{
                    background: i === 0 ? "rgba(245,158,11,.12)" : "var(--panel-2)",
                    borderColor: i === 0 ? "var(--accent)" : "var(--border)",
                    color: i === 0 ? "var(--accent-soft)" : "var(--text)",
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="settings-row">
          <div>
            <div className="sr-label">Descripción del negocio</div>
            <div className="sr-hint">M2 usa esto para responder preguntas generales</div>
          </div>
          <div className="sr-control" style={{ width: "100%" }}>
            <textarea
              className="input"
              rows={3}
              defaultValue="Cafetería artesanal en Monterrey. Vendemos café en grano, molidos y bebidas para llevar."
              style={{ resize: "vertical", width: "100%", maxWidth: 440 }}
            />
          </div>
        </div>

        <div className="settings-row">
          <div>
            <div className="sr-label">Escalar a humano cuando…</div>
            <div className="sr-hint">Situaciones que requieren tu intervención</div>
          </div>
          <div className="sr-control" style={{ flexDirection: "column", alignItems: "flex-start", gap: 6 }}>
            {escalations.map((r, i) => (
              <label key={i} className="checkbox">
                <input type="checkbox" defaultChecked={i < 3} />
                <span className="box" />
                <span style={{ fontSize: 13 }}>{r}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="settings-row">
          <div>
            <div className="sr-label">Mensajes / mes</div>
            <div className="sr-hint">Cupo actual del plan Pro</div>
          </div>
          <div className="sr-control" style={{ flex: 1, flexDirection: "column", alignItems: "stretch", gap: 6 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontFamily: "var(--font-mono)",
                fontSize: 12,
                color: "var(--text-muted)",
              }}
            >
              <span>6,214 / 10,000</span>
              <span>62%</span>
            </div>
            <div style={{ height: 6, background: "var(--panel-2)", borderRadius: 3, overflow: "hidden" }}>
              <div
                style={{
                  height: "100%",
                  width: "62%",
                  background: "linear-gradient(90deg, var(--accent), var(--accent-soft))",
                }}
              />
            </div>
            <a href="#" style={{ fontSize: 12, color: "var(--accent-soft)", textDecoration: "none", marginTop: 4 }}>
              Upgrade a Business →
            </a>
          </div>
        </div>
      </div>

      <div className="settings-section">
        <h3>Base de conocimiento</h3>
        <div className="ss-sub">Archivos y FAQs que M2 usa para responder</div>
        {sources.map((k, i) => (
          <div key={i} className="settings-row" style={{ gridTemplateColumns: "1fr auto", paddingLeft: 0 }}>
            <div>
              <div className="sr-label">{k.n}</div>
              <div className="sr-hint">
                {k.c} · {k.t}
              </div>
            </div>
            <div className="sr-control">
              <button type="button" className="btn btn-subtle btn-sm">
                Editar
              </button>
            </div>
          </div>
        ))}
        <button type="button" className="btn btn-subtle btn-sm" style={{ marginTop: 10 }}>
          <AppIcon name="plus" size={12} /> Agregar fuente
        </button>
      </div>
    </>
  );
}

function BillingTab() {
  const plans: { plan: string; price: string; msgs: string; users: string; current?: boolean }[] = [
    { plan: "Starter", price: "$19", msgs: "2k msgs", users: "1 usuario" },
    { plan: "Pro", price: "$49", msgs: "10k msgs", users: "5 usuarios", current: true },
    { plan: "Business", price: "$149", msgs: "50k msgs", users: "Ilimitado" },
  ];

  const history = [
    { d: "1 abr 2026", n: "Plan Pro · mensual", a: "$49.00" },
    { d: "1 mar 2026", n: "Plan Pro · mensual", a: "$49.00" },
    { d: "1 feb 2026", n: "Plan Pro · mensual", a: "$49.00" },
  ];

  return (
    <>
      <div className="settings-section">
        <h3>Plan actual</h3>
        <div className="ss-sub">Pro · $49/mes · renueva el 1 de mayo</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
          {plans.map((p, i) => (
            <div
              key={i}
              style={{
                padding: 18,
                background: p.current ? "rgba(245,158,11,.06)" : "var(--panel-2)",
                border: `1px solid ${p.current ? "var(--accent)" : "var(--border)"}`,
                borderRadius: 12,
                position: "relative",
              }}
            >
              {p.current && <span className="badge badge-amber" style={{ position: "absolute", top: 12, right: 12 }}>Actual</span>}
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>{p.plan}</div>
              <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: "-0.02em" }}>
                {p.price}
                <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 400 }}>/mes</span>
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 10, lineHeight: 1.6 }}>
                {p.msgs}
                <br />
                {p.users}
              </div>
              <button
                type="button"
                className="btn btn-sm"
                style={{
                  width: "100%",
                  justifyContent: "center",
                  marginTop: 14,
                  background: p.current ? "var(--panel-3)" : "var(--accent)",
                  color: p.current ? "var(--text-muted)" : "#2a1605",
                  border: "none",
                }}
                disabled={p.current}
              >
                {p.current ? "Plan actual" : i < 1 ? "Downgrade" : "Upgrade"}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="settings-section">
        <h3>Método de pago</h3>
        <div className="settings-row" style={{ gridTemplateColumns: "1fr auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 44,
                height: 30,
                borderRadius: 6,
                background: "linear-gradient(135deg,#1a365d,#2563eb)",
                display: "grid",
                placeItems: "center",
                color: "white",
                fontWeight: 700,
                fontSize: 10,
                letterSpacing: ".1em",
              }}
            >
              VISA
            </div>
            <div>
              <div className="sr-label">•••• •••• •••• 4242</div>
              <div className="sr-hint">Expira 11/28 · Andrea Castillo</div>
            </div>
          </div>
          <button type="button" className="btn btn-subtle btn-sm">
            Actualizar
          </button>
        </div>
      </div>

      <div className="settings-section">
        <h3>Historial</h3>
        <table style={{ width: "100%", fontSize: 13 }}>
          <thead>
            <tr
              style={{
                textAlign: "left",
                fontFamily: "var(--font-mono)",
                fontSize: 10.5,
                color: "var(--text-dim)",
                textTransform: "uppercase",
                letterSpacing: ".06em",
              }}
            >
              <th style={{ padding: "8px 0", fontWeight: 400 }}>Fecha</th>
              <th style={{ fontWeight: 400 }}>Descripción</th>
              <th style={{ fontWeight: 400 }}>Monto</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {history.map((r, i) => (
              <tr key={i} style={{ borderTop: "1px solid var(--border)" }}>
                <td style={{ padding: "12px 0", color: "var(--text-muted)" }}>{r.d}</td>
                <td>{r.n}</td>
                <td style={{ fontFamily: "var(--font-mono)" }}>{r.a}</td>
                <td style={{ textAlign: "right" }}>
                  <a href="#" style={{ color: "var(--accent-soft)", fontSize: 12, textDecoration: "none" }}>
                    Factura PDF ↓
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function SecurityTab() {
  const sessions: { d: string; loc: string; current?: boolean }[] = [
    { d: "Mac · Chrome", loc: "Monterrey, MX · ahora", current: true },
    { d: "iPhone · Safari", loc: "Monterrey, MX · hace 2h" },
  ];

  return (
    <div className="settings-section">
      <h3>Seguridad</h3>
      <div className="ss-sub">Protege tu cuenta y tus datos</div>

      <div className="settings-row">
        <div>
          <div className="sr-label">Contraseña</div>
          <div className="sr-hint">Última actualización hace 2 meses</div>
        </div>
        <div className="sr-control">
          <button type="button" className="btn btn-subtle btn-sm">
            Cambiar
          </button>
        </div>
      </div>

      <div className="settings-row">
        <div>
          <div className="sr-label">Autenticación 2 factores</div>
          <div className="sr-hint">Email con código de 6 dígitos</div>
        </div>
        <div className="sr-control">
          <span className="badge badge-green">Activo</span>
          <button type="button" className="btn btn-subtle btn-sm">
            Gestionar
          </button>
        </div>
      </div>

      <div className="settings-row">
        <div>
          <div className="sr-label">Sesiones activas</div>
          <div className="sr-hint">2 dispositivos</div>
        </div>
        <div className="sr-control" style={{ flex: 1, flexDirection: "column", alignItems: "stretch", gap: 8 }}>
          {sessions.map((s, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: 10,
                background: "var(--panel-2)",
                border: "1px solid var(--border)",
                borderRadius: 8,
              }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>
                  {s.d}{" "}
                  {s.current && (
                    <span className="badge badge-green" style={{ marginLeft: 6 }}>
                      Actual
                    </span>
                  )}
                </div>
                <div
                  style={{
                    fontSize: 11.5,
                    color: "var(--text-dim)",
                    fontFamily: "var(--font-mono)",
                    marginTop: 2,
                  }}
                >
                  {s.loc}
                </div>
              </div>
              {!s.current && (
                <button type="button" className="btn btn-subtle btn-sm">
                  Cerrar
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            style={{ alignSelf: "flex-start", marginTop: 4, color: "#fca5a5" }}
          >
            Cerrar todas las demás
          </button>
        </div>
      </div>
    </div>
  );
}

function TeamTab() {
  const members: { n: string; e: string; r: string; s: string; you?: boolean }[] = [
    { n: "Andrea Castillo", e: "andrea@milacafe.mx", r: "Admin", s: "En línea", you: true },
    { n: "Diego Ramírez", e: "diego@milacafe.mx", r: "Agente", s: "En línea" },
    { n: "Ana Luna", e: "ana@milacafe.mx", r: "Agente", s: "Hace 2h" },
    { n: "Pedro Sánchez", e: "pedro@milacafe.mx", r: "Viewer", s: "Hace 1 día" },
  ];

  return (
    <div className="settings-section">
      <h3>Equipo</h3>
      <div className="ss-sub">Administra los miembros y sus permisos</div>

      {members.map((m, i) => (
        <div key={i} className="settings-row" style={{ gridTemplateColumns: "40px 1fr auto auto auto" }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: `linear-gradient(135deg, hsl(${i * 60}, 60%, 50%), hsl(${i * 60 + 30}, 60%, 40%))`,
              display: "grid",
              placeItems: "center",
              fontSize: 13,
              fontWeight: 600,
              color: "white",
            }}
          >
            {m.n
              .split(" ")
              .map((p) => p[0])
              .join("")}
          </div>
          <div>
            <div className="sr-label">
              {m.n}{" "}
              {m.you && (
                <span className="badge badge-amber" style={{ marginLeft: 6 }}>
                  Tú
                </span>
              )}
            </div>
            <div className="sr-hint">{m.e}</div>
          </div>
          <span className="badge badge-neutral">{m.r}</span>
          <span style={{ fontSize: 11.5, color: "var(--text-dim)", fontFamily: "var(--font-mono)" }}>{m.s}</span>
          <button type="button" className="btn-icon">
            <AppIcon name="more" size={16} />
          </button>
        </div>
      ))}

      <button type="button" className="btn btn-primary btn-sm" style={{ marginTop: 14 }}>
        <AppIcon name="plus" size={12} /> Invitar miembro
      </button>
    </div>
  );
}

function PlaceholderTab({ name }: { name: string }): ReactNode {
  return (
    <div className="settings-section" style={{ textAlign: "center", padding: 48 }}>
      <AppIcon name="settings" size={32} color="var(--text-dim)" />
      <div style={{ fontSize: 15, marginTop: 12, color: "var(--text-muted)" }}>Sección &quot;{name}&quot;</div>
      <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 4 }}>
        Estructura similar a Perfil — estilos y layout ya listos
      </div>
    </div>
  );
}
