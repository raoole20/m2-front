"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import { auth, ApiError, createBrowserTokenStore, setTokenStore } from "@m2/api-client";
import { AppIcon } from "../../../../../src/components/m2/AppIcon";
import { AuthVisual } from "../../../../../src/components/m2/AuthVisual";
import { SocialAuthButtons } from "../../../../../src/components/m2/SocialAuthButtons";
import { Logo } from "@/src/components/Logo";

const tokenStore = createBrowserTokenStore();
setTokenStore(tokenStore);

const STRENGTH_LABELS = ["Débil", "Débil", "Media", "Buena", "Fuerte"];
const STRENGTH_COLORS = ["#ef4444", "#ef4444", "#f59e0b", "#22c55e", "#10b981"];

function computeStrength(pw: string): number {
  const base = Math.floor(pw.length / 3) + (/[A-Z]/.test(pw) ? 1 : 0) + (/\d/.test(pw) ? 1 : 0) - (pw.length < 8 ? 1 : 0);
  return Math.min(4, Math.max(0, base));
}

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function RegisterPage() {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const locale = pathname.startsWith("/en") ? "en" : "es";
  const base = locale === "es" ? "/admin" : "/en/admin";

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [pw, setPw] = useState("");
  const [terms, setTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const strength = computeStrength(pw);
  const strengthLabel = STRENGTH_LABELS[strength];
  const strengthColor = STRENGTH_COLORS[strength];

  const canSubmit = firstName.trim() && email.trim() && company.trim() && pw.length >= 8 && terms && !loading;

  async function handleSubmit() {
    if (!canSubmit) return;
    setError(null);
    setLoading(true);

    try {
      await auth.register({
        tenantName: company.trim(),
        tenantSlug: toSlug(company),
        email: email.trim().toLowerCase(),
        password: pw,
        name: `${firstName.trim()} ${lastName.trim()}`.trim(),
      });
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === "CONFLICT") {
          setError("Ya existe una cuenta con ese nombre de empresa. Prueba con otro nombre.");
        } else if (err.code === "BAD_REQUEST") {
          setError(err.message);
        } else {
          setError("No se pudo crear la cuenta. Intenta de nuevo.");
        }
      } else {
        setError("Error de conexión. Intenta de nuevo.");
      }
      setLoading(false);
      return;
    }

    try {
      const loginResult = await auth.login({
        email: email.trim().toLowerCase(),
        password: pw,
      });
      tokenStore.set({
        accessToken: loginResult.accessToken,
        refreshToken: loginResult.refreshToken,
      });
      router.push(`${base}/onboarding`);
    } catch (err) {
      if (err instanceof ApiError && err.message === "EMAIL_NOT_VERIFIED") {
        router.push(
          `${base}/login?verifyEmail=${encodeURIComponent(email.trim().toLowerCase())}`,
        );
      } else {
        setError(
          "Cuenta creada, pero no pudimos iniciar sesión automáticamente. Intenta entrar manualmente.",
        );
        setLoading(false);
      }
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
              <h1>Empieza gratis</h1>
              <div className="sub" style={{ marginTop: 10 }}>
                14 días de prueba. Sin tarjeta de crédito.
              </div>
            </div>

            <SocialAuthButtons />

            <div className="divider">o con tu email</div>

            {error && (
              <div
                role="alert"
                data-testid="register-error"
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

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div className="input-group">
                <label className="label">Nombre</label>
                <input
                  className="input"
                  placeholder="Andrea"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  data-testid="input-firstname"
                />
              </div>
              <div className="input-group">
                <label className="label">Apellido</label>
                <input
                  className="input"
                  placeholder="Castillo"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  data-testid="input-lastname"
                />
              </div>
            </div>

            <div className="input-group">
              <label className="label">Email de trabajo</label>
              <div className="input-icon">
                <AppIcon name="mail" size={16} />
                <input
                  className="input"
                  type="email"
                  placeholder="tu@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  data-testid="input-email"
                />
              </div>
            </div>

            <div className="input-group">
              <label className="label">Empresa</label>
              <div className="input-icon">
                <AppIcon name="building" size={16} />
                <input
                  className="input"
                  placeholder="Nombre del negocio"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  data-testid="input-company"
                />
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
                  data-testid="input-password"
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
                    data-testid="pw-strength"
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
              <input
                type="checkbox"
                checked={terms}
                onChange={(e) => setTerms(e.target.checked)}
                data-testid="checkbox-terms"
              />
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

            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={!canSubmit}
              data-testid="btn-submit"
            >
              {loading ? "Creando cuenta…" : <>Crear cuenta <AppIcon name="arrow-right" size={14} /></>}
            </button>

            <div className="link-row">
              ¿Ya tienes cuenta? <Link href={`${base}/login`}>Entra</Link>
            </div>
          </div>
        </div>
      </div>

      <AuthVisual />
    </div>
  );
}
