"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import { AppIcon } from "../../../../src/components/m2/AppIcon";
import { AuthVisual } from "../../../../src/components/m2/AuthVisual";
import { SocialAuthButtons } from "../../../../src/components/m2/SocialAuthButtons";

const STRENGTH_LABELS = ["Débil", "Débil", "Media", "Buena", "Fuerte"];
const STRENGTH_COLORS = ["#ef4444", "#ef4444", "#f59e0b", "#22c55e", "#10b981"];

function computeStrength(pw: string): number {
  const base = Math.floor(pw.length / 3) + (/[A-Z]/.test(pw) ? 1 : 0) + (/\d/.test(pw) ? 1 : 0) - (pw.length < 8 ? 1 : 0);
  return Math.min(4, Math.max(0, base));
}

export default function RegisterPage() {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const locale = pathname.startsWith("/en") ? "en" : "es";
  const base = locale === "es" ? "/admin" : "/en/admin";

  const [pw, setPw] = useState("");
  const strength = computeStrength(pw);
  const strengthLabel = STRENGTH_LABELS[strength];
  const strengthColor = STRENGTH_COLORS[strength];

  return (
    <div className="m2-app auth">
      <div className="auth-form-col">
        <Link href={`${base}/dashboard`} className="auth-logo">
          <span className="mark">m</span>M2
        </Link>
        <div className="auth-form-wrap">
          <div className="auth-form">
            <div>
              <h1>Empieza gratis</h1>
              <div className="sub" style={{ marginTop: 10 }}>
                14 días de prueba. Sin tarjeta de crédito.
              </div>
            </div>

            <SocialAuthButtons />

            <div className="divider">o con tu email</div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div className="input-group">
                <label className="label">Nombre</label>
                <input className="input" placeholder="Andrea" defaultValue="Andrea" />
              </div>
              <div className="input-group">
                <label className="label">Apellido</label>
                <input className="input" placeholder="Castillo" defaultValue="Castillo" />
              </div>
            </div>

            <div className="input-group">
              <label className="label">Email de trabajo</label>
              <div className="input-icon">
                <AppIcon name="mail" size={16} />
                <input className="input" type="email" placeholder="tu@empresa.com" defaultValue="andrea@milacafe.mx" />
              </div>
            </div>

            <div className="input-group">
              <label className="label">Empresa</label>
              <div className="input-icon">
                <AppIcon name="building" size={16} />
                <input className="input" placeholder="Nombre del negocio" defaultValue="Mila Café" />
              </div>
            </div>

            <div className="input-group">
              <label className="label">Contraseña</label>
              <div className="input-icon">
                <AppIcon name="lock" size={16} />
                <input
                  className="input"
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                />
              </div>
              {pw.length > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                  <div style={{ flex: 1, height: 3, background: "var(--border)", borderRadius: 2, overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${(strength + 1) * 20}%`,
                        background: strengthColor,
                        transition: "all 200ms",
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      color: strengthColor,
                      fontFamily: "var(--font-mono)",
                      textTransform: "uppercase",
                      letterSpacing: ".05em",
                    }}
                  >
                    {strengthLabel}
                  </span>
                </div>
              )}
            </div>

            <label className="checkbox" style={{ alignItems: "flex-start" }}>
              <input type="checkbox" />
              <span className="box" style={{ marginTop: 2 }} />
              <span style={{ fontSize: 12.5, color: "var(--text-muted)", lineHeight: 1.4 }}>
                Acepto los{" "}
                <a href="#" style={{ color: "var(--accent-soft)" }}>
                  Términos
                </a>{" "}
                y la{" "}
                <a href="#" style={{ color: "var(--accent-soft)" }}>
                  Política de privacidad
                </a>{" "}
                de M2.
              </span>
            </label>

            <button type="button" className="btn btn-primary" onClick={() => router.push(`${base}/onboarding`)}>
              Crear cuenta <AppIcon name="arrow-right" size={14} />
            </button>

            <div className="link-row">
              ¿Ya tienes cuenta? <Link href={`${base}/login`}>Entra</Link>
            </div>
          </div>
        </div>
      </div>

      <AuthVisual variant="register" />
    </div>
  );
}
