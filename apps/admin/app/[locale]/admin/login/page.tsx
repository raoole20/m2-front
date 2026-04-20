"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import { AppIcon } from "../../../../src/components/m2/AppIcon";
import { AuthVisual } from "../../../../src/components/m2/AuthVisual";
import { SocialAuthButtons } from "../../../../src/components/m2/SocialAuthButtons";

export default function LoginPage() {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const locale = pathname.startsWith("/en") ? "en" : "es";
  const base = locale === "es" ? "/admin" : "/en/admin";

  const [showPw, setShowPw] = useState(false);

  return (
    <div className="m2-app auth">
      <div className="auth-form-col">
        <Link href={`${base}/dashboard`} className="auth-logo">
          <span className="mark">m</span>M2
        </Link>
        <div className="auth-form-wrap">
          <div className="auth-form">
            <div>
              <h1>Bienvenido de vuelta</h1>
              <div className="sub" style={{ marginTop: 10 }}>
                Entra a tu bandeja unificada.
              </div>
            </div>

            <SocialAuthButtons />

            <div className="divider">o con tu email</div>

            <div className="input-group">
              <label className="label">Email</label>
              <div className="input-icon">
                <AppIcon name="mail" size={16} />
                <input className="input" type="email" placeholder="tu@empresa.com" defaultValue="andrea@milacafe.mx" />
              </div>
            </div>

            <div className="input-group">
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <label className="label">Contraseña</label>
                <Link
                  href={`${base}/recover`}
                  style={{
                    fontSize: 11.5,
                    color: "var(--accent-soft)",
                    textDecoration: "none",
                    fontFamily: "var(--font-mono)",
                    letterSpacing: ".04em",
                    textTransform: "uppercase",
                  }}
                >
                  ¿Olvidaste?
                </Link>
              </div>
              <div className="input-icon" style={{ position: "relative" }}>
                <AppIcon name="lock" size={16} />
                <input className="input" type={showPw ? "text" : "password"} placeholder="••••••••••" defaultValue="supersecret" />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  style={{
                    position: "absolute",
                    right: 8,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "transparent",
                    border: "none",
                    color: "var(--text-dim)",
                    cursor: "pointer",
                    padding: 6,
                  }}
                  aria-label="Mostrar contraseña"
                >
                  <AppIcon name="eye" size={16} />
                </button>
              </div>
            </div>

            <label className="checkbox">
              <input type="checkbox" defaultChecked />
              <span className="box" />
              <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Mantener sesión iniciada</span>
            </label>

            <button type="button" className="btn btn-primary" onClick={() => router.push(`${base}/2fa`)}>
              Entrar <AppIcon name="arrow-right" size={14} />
            </button>

            <div className="link-row">
              ¿No tienes cuenta? <Link href={`${base}/register`}>Regístrate gratis</Link>
            </div>
          </div>
        </div>

        <div
          style={{
            fontSize: 11.5,
            color: "var(--text-dim)",
            fontFamily: "var(--font-mono)",
            textTransform: "uppercase",
            letterSpacing: ".06em",
            marginTop: "auto",
          }}
        >
          © 2026 M2 · Todas las conversaciones, una bandeja
        </div>
      </div>

      <AuthVisual variant="login" />
    </div>
  );
}
