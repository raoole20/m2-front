"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import { auth, createBrowserTokenStore, setTokenStore, ApiError } from "@m2/api-client";
import { AppIcon } from "../../../../src/components/m2/AppIcon";
import { AuthVisual } from "../../../../src/components/m2/AuthVisual";
import { SocialAuthButtons } from "../../../../src/components/m2/SocialAuthButtons";
import { Logo } from "../../_components/Logo";

const tokenStore = createBrowserTokenStore();
setTokenStore(tokenStore);

export default function LoginPage() {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const locale = pathname.startsWith("/en") ? "en" : "es";
  const base = locale === "es" ? "/admin" : "/en/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!email || !password) return;
    setError(null);
    setLoading(true);

    try {
      const data = await auth.login({ email, password });
      tokenStore.set({ accessToken: data.accessToken, refreshToken: data.refreshToken });
      router.push(`${base}/dashboard`);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.message === "EMAIL_NOT_VERIFIED") {
          setError("Debes verificar tu email antes de entrar. Revisa tu bandeja de entrada.");
        } else {
          setError("Email o contraseña incorrectos.");
        }
      } else {
        setError("Error de conexión. Intenta de nuevo.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="m2-app auth">
      <div className="auth-form-col">
        <Link href={`${base}/dashboard`} className="auth-logo">
          <Logo height={28} />
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

            {error && (
              <div
                role="alert"
                data-testid="login-error"
                style={{
                  padding: "10px 14px",
                  borderRadius: 8,
                  background: "rgba(239,68,68,.1)",
                  border: "1px solid rgba(239,68,68,.25)",
                  color: "#ef4444",
                  fontSize: 13,
                }}
              >
                {error}
              </div>
            )}

            <div className="input-group">
              <label className="label">Email</label>
              <div className="input-icon">
                <AppIcon name="mail" size={16} />
                <input
                  className="input"
                  type="email"
                  placeholder="tu@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  data-testid="input-email"
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                />
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
                <input
                  className="input"
                  type={showPw ? "text" : "password"}
                  placeholder="••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  data-testid="input-password"
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                />
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

            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={loading || !email || !password}
              data-testid="btn-submit"
            >
              {loading ? "Entrando…" : <>Entrar <AppIcon name="arrow-right" size={14} /></>}
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

      <AuthVisual />
    </div>
  );
}
