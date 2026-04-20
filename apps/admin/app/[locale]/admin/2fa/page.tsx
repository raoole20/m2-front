"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useRef, useState, type KeyboardEvent } from "react";

import { AppIcon } from "../../../../src/components/m2/AppIcon";
import { AuthVisual } from "../../../../src/components/m2/AuthVisual";

export default function TwoFAPage() {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const locale = pathname.startsWith("/en") ? "en" : "es";
  const base = locale === "es" ? "/admin" : "/en/admin";

  const [code, setCode] = useState<string[]>(["", "", "", "", "", ""]);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const handle = (i: number, raw: string) => {
    let v = raw;
    if (v.length > 1) v = v.slice(-1);
    if (!/^\d?$/.test(v)) return;
    const next = [...code];
    next[i] = v;
    setCode(next);
    if (v && i < 5) refs.current[i + 1]?.focus();
  };

  const handleKey = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[i] && i > 0) refs.current[i - 1]?.focus();
  };

  const filled = code.every((c) => c);

  return (
    <div className="m2-app auth">
      <div className="auth-form-col">
        <Link href={`${base}/login`} className="auth-logo">
          <span className="mark">m</span>M2
        </Link>
        <div className="auth-form-wrap">
          <div className="auth-form">
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
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 14,
                background: "rgba(245,158,11,.12)",
                border: "1px solid rgba(245,158,11,.25)",
                display: "grid",
                placeItems: "center",
              }}
            >
              <AppIcon name="shield" size={24} color="var(--accent-soft)" />
            </div>
            <div>
              <h1>Verifica tu identidad</h1>
              <div className="sub" style={{ marginTop: 10 }}>
                Enviamos un código de 6 dígitos a <b style={{ color: "var(--text)" }}>andrea@milacafe.mx</b>.
              </div>
            </div>

            <div className="otp">
              {code.map((c, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    refs.current[i] = el;
                  }}
                  value={c}
                  onChange={(e) => handle(i, e.target.value)}
                  onKeyDown={(e) => handleKey(i, e)}
                  className={c ? "filled" : ""}
                  maxLength={1}
                  inputMode="numeric"
                  autoFocus={i === 0}
                />
              ))}
            </div>

            <button
              type="button"
              className="btn btn-primary"
              disabled={!filled}
              onClick={() => router.push(`${base}/onboarding`)}
            >
              Verificar <AppIcon name="arrow-right" size={14} />
            </button>

            <div className="link-row">
              ¿No recibiste el código? <a href="#">Reenviar en 28s</a>
            </div>
            <div
              style={{
                textAlign: "center",
                fontSize: 12,
                color: "var(--text-dim)",
                fontFamily: "var(--font-mono)",
                textTransform: "uppercase",
                letterSpacing: ".06em",
              }}
            >
              Código demo: <b style={{ color: "var(--accent-soft)" }}>142857</b>
            </div>
          </div>
        </div>
      </div>

      <AuthVisual variant="login" />
    </div>
  );
}
