"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import { AppIcon } from "../../../../../src/components/m2/AppIcon";

type ChannelDef = { k: "wa" | "ig" | "tg" | "em"; name: string; desc: string; icon: string };

const CHANNELS: ChannelDef[] = [
  { k: "wa", name: "WhatsApp Business", desc: "Mensajes, catálogo y ventas directas", icon: "whatsapp" },
  { k: "ig", name: "Instagram DM", desc: "Direct messages + respuestas a historias", icon: "instagram" },
  { k: "tg", name: "Telegram", desc: "Canales y chats 1-a-1", icon: "telegram" },
  { k: "em", name: "Email", desc: "Tu bandeja de soporte y ventas", icon: "mail" },
];

const TONES = ["cercano", "profesional", "casual", "divertido"] as const;
type Tone = (typeof TONES)[number];

export default function OnboardingPage() {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const locale = pathname.startsWith("/en") ? "en" : "es";
  const base = locale === "es" ? "/admin" : "/en/admin";

  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<string[]>(["wa"]);
  const [brand, setBrand] = useState<{ name: string; tone: Tone; desc: string }>({
    name: "Mila Café",
    tone: "cercano",
    desc: "Cafetería artesanal en Monterrey. Vendemos café en grano, molidos y bebidas para llevar.",
  });

  const toggle = (k: string) =>
    setSelected((sel) => (sel.includes(k) ? sel.filter((x) => x !== k) : [...sel, k]));

  return (
    <div className="m2-app wizard-page">
      <div className="topnav">
        <div className="logo">
          <span className="mark">m</span>M2
        </div>
        <div style={{ flex: 1 }} />
        <button
          type="button"
          onClick={() => router.push(`${base}/dashboard`)}
          style={{ fontSize: 13, color: "var(--text-muted)", background: "transparent", border: "none", cursor: "pointer" }}
        >
          Saltar por ahora
        </button>
      </div>

      <div className="wizard-container">
        <div className="wizard-steps">
          <div className={`step ${step >= 0 ? (step > 0 ? "done" : "on") : ""}`}>
            <div className="num">{step > 0 ? <AppIcon name="check" size={12} color="#2a1605" /> : "1"}</div>
            <span>Canales</span>
          </div>
          <div className={`line ${step > 0 ? "done" : ""}`} />
          <div className={`step ${step >= 1 ? (step > 1 ? "done" : "on") : ""}`}>
            <div className="num">{step > 1 ? <AppIcon name="check" size={12} color="#2a1605" /> : "2"}</div>
            <span>Marca</span>
          </div>
          <div className={`line ${step > 1 ? "done" : ""}`} />
          <div className={`step ${step >= 2 ? "on" : ""}`}>
            <div className="num">3</div>
            <span>Listo</span>
          </div>
        </div>

        {step === 0 && (
          <>
            <h2 className="wizard-title">¿Qué canales quieres conectar?</h2>
            <p className="wizard-sub">Elige los que ya usas. Puedes agregar o quitar después desde Settings.</p>

            <div className="channel-grid">
              {CHANNELS.map((c) => (
                <div
                  key={c.k}
                  className={`ch-option ${selected.includes(c.k) ? "on" : ""}`}
                  onClick={() => toggle(c.k)}
                >
                  <div className={`ch-icon ${c.k}`}>
                    <AppIcon name={c.icon} size={22} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="ch-name">{c.name}</div>
                    <div className="ch-desc">{c.desc}</div>
                  </div>
                  <div className="ch-check" />
                </div>
              ))}
            </div>

            <div className="wizard-nav">
              <Link href={`${base}/login`} className="btn btn-ghost">
                Cancelar
              </Link>
              <button
                type="button"
                className="btn btn-primary"
                disabled={selected.length === 0}
                onClick={() => setStep(1)}
              >
                Continuar <AppIcon name="arrow-right" size={14} />
              </button>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h2 className="wizard-title">Cuéntanos de tu marca</h2>
            <p className="wizard-sub">M2 usa esto para responder con tu tono y estilo.</p>

            <div style={{ display: "flex", flexDirection: "column", gap: 18, marginBottom: 32 }}>
              <div className="input-group">
                <label className="label">Nombre del negocio</label>
                <input
                  className="input"
                  value={brand.name}
                  onChange={(e) => setBrand({ ...brand, name: e.target.value })}
                />
              </div>

              <div className="input-group">
                <label className="label">Descripción corta</label>
                <textarea
                  className="input"
                  rows={3}
                  value={brand.desc}
                  onChange={(e) => setBrand({ ...brand, desc: e.target.value })}
                  style={{ resize: "vertical" }}
                />
                <div className="helper">Máximo 2 párrafos. M2 la usará para contestar preguntas generales.</div>
              </div>

              <div className="input-group">
                <label className="label">Tono de voz</label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                  {TONES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setBrand({ ...brand, tone: t })}
                      className="btn"
                      style={{
                        background: brand.tone === t ? "rgba(245,158,11,.12)" : "var(--panel-2)",
                        borderColor: brand.tone === t ? "var(--accent)" : "var(--border)",
                        color: brand.tone === t ? "var(--accent-soft)" : "var(--text)",
                        textTransform: "capitalize",
                        fontSize: 13,
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="wizard-nav">
              <button type="button" className="btn btn-ghost" onClick={() => setStep(0)}>
                Atrás
              </button>
              <button type="button" className="btn btn-primary" onClick={() => setStep(2)}>
                Continuar <AppIcon name="arrow-right" size={14} />
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: 20,
                background: "rgba(245,158,11,.12)",
                border: "1px solid rgba(245,158,11,.25)",
                display: "grid",
                placeItems: "center",
                margin: "0 0 24px",
              }}
            >
              <AppIcon name="rocket" size={32} color="var(--accent-soft)" />
            </div>
            <h2 className="wizard-title">Todo listo, {brand.name.split(" ")[0] || "Andrea"}.</h2>
            <p className="wizard-sub">
              Conectaste{" "}
              <b style={{ color: "var(--text)" }}>
                {selected.length} canal{selected.length > 1 ? "es" : ""}
              </b>{" "}
              y entrenaste tu IA con tono <b style={{ color: "var(--accent-soft)" }}>{brand.tone}</b>. Ya puedes empezar a
              recibir mensajes.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 32 }}>
              {[
                { i: "inbox", t: "Tu primera conversación", d: "Te enviamos un chat de demo a tu bandeja" },
                { i: "bot", t: "IA ya activa", d: "Contesta 24/7 en tu tono" },
                { i: "bolt", t: "Listo en 3 min", d: "Sin código, sin config extra" },
              ].map((x, i) => (
                <div
                  key={i}
                  style={{ padding: "16px", background: "var(--panel)", border: "1px solid var(--border)", borderRadius: 12 }}
                >
                  <div style={{ color: "var(--accent-soft)", marginBottom: 8 }}>
                    <AppIcon name={x.i} size={18} />
                  </div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 4 }}>{x.t}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.4 }}>{x.d}</div>
                </div>
              ))}
            </div>

            <div className="wizard-nav">
              <button type="button" className="btn btn-ghost" onClick={() => setStep(1)}>
                Atrás
              </button>
              <button
                type="button"
                className="btn btn-primary btn-lg"
                onClick={() => router.push(`${base}/dashboard`)}
              >
                Ir a mi bandeja <AppIcon name="arrow-right" size={14} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
