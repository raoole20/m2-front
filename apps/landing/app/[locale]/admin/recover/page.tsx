"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { AppIcon } from "../../../../src/components/m2/AppIcon";
import { AuthVisual } from "../../../../src/components/m2/AuthVisual";

export default function RecoverPage() {
  const pathname = usePathname() ?? "";
  const locale = pathname.startsWith("/en") ? "en" : "es";
  const base = locale === "es" ? "/admin" : "/en/admin";

  const [sent, setSent] = useState(false);

  return (
    <div className="m2-app auth">
      <div className="auth-form-col">
        <Link href={`${base}/login`} className="auth-logo">
          <span className="mark">m</span>M2
        </Link>
        <div className="auth-form-wrap">
          <div className="auth-form">
            {!sent ? (
              <>
                <Link
                  href={`${base}/login`}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 12,
                    color: "var(--text-muted)",
                    fontFamily: "var(--font-mono)",
                    textTransform: "uppercase",
                    letterSpacing: ".06em",
                    textDecoration: "none",
                    marginBottom: -4,
                  }}
                >
                  <AppIcon name="arrow-left" size={12} /> Volver
                </Link>
                <div>
                  <h1>Recupera tu acceso</h1>
                  <div className="sub" style={{ marginTop: 10 }}>
                    Te enviaremos un link para crear una nueva contraseña.
                  </div>
                </div>

                <div className="input-group">
                  <label className="label">Email</label>
                  <div className="input-icon">
                    <AppIcon name="mail" size={16} />
                    <input className="input" type="email" placeholder="tu@empresa.com" defaultValue="andrea@milacafe.mx" />
                  </div>
                </div>

                <button type="button" className="btn btn-primary" onClick={() => setSent(true)}>
                  Enviar link de recuperación
                </button>

                <div className="link-row">
                  ¿Tu cuenta está bien? <Link href={`${base}/login`}>Entrar</Link>
                </div>
              </>
            ) : (
              <>
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 16,
                    background: "rgba(245,158,11,.12)",
                    border: "1px solid rgba(245,158,11,.25)",
                    display: "grid",
                    placeItems: "center",
                    margin: "0 auto",
                  }}
                >
                  <AppIcon name="mail" size={28} color="var(--accent-soft)" />
                </div>
                <div style={{ textAlign: "center" }}>
                  <h1 style={{ fontSize: 26 }}>Revisa tu email</h1>
                  <div className="sub" style={{ marginTop: 12 }}>
                    Enviamos un link a <b style={{ color: "var(--text)" }}>andrea@milacafe.mx</b>.
                    <br />
                    Caduca en 30 minutos.
                  </div>
                </div>

                <button type="button" className="btn btn-ghost" onClick={() => setSent(false)}>
                  Usar otro email
                </button>

                <div className="link-row">
                  ¿No lo ves? <a href="#">Reenviar</a> · <Link href={`${base}/login`}>Volver</Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <AuthVisual variant="recover" />
    </div>
  );
}
