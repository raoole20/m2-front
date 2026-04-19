"use client";

import { auth, createBrowserTokenStore } from "@m2/api-client";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { z } from "zod";

import { Button, Input } from "@m2/ui";

import { useAuth } from "../../../../src/hooks/use-auth";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const locale = pathname?.startsWith("/en") ? "en" : "es";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const authState = useAuth();

  const redirect = searchParams?.get("redirect") || `/${locale === "es" ? "" : "en/"}admin`;

  useEffect(() => {
    if (authState.user) {
      router.replace(redirect);
    }
  }, [authState.user, redirect, router]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldError(null);

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setFieldError(locale === "es" ? "Credenciales invalidas" : "Invalid credentials");
      return;
    }

    setIsLoading(true);
    try {
      const result = await auth.login(parsed.data);
      const tokenStore = createBrowserTokenStore();
      tokenStore.set({ accessToken: result.accessToken, refreshToken: result.refreshToken });
      router.replace(redirect);
    } catch {
      setFieldError(locale === "es" ? "Credenciales invalidas" : "Invalid credentials");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="mx-auto mt-20 w-full max-w-md rounded-2xl border border-stroke-subtle bg-surface-container/70 p-6 shadow-glow-secondary">
      <h1 className="mb-1 font-display text-3xl font-extrabold text-text-primary">
        {locale === "es" ? "Iniciar sesion" : "Log in"}
      </h1>
      <p className="mb-6 text-sm text-text-secondary">
        {locale === "es" ? "Accede a tu panel" : "Access your workspace"}
      </p>

      <form className="space-y-4" onSubmit={onSubmit}>
        <Input
          disabled={isLoading}
          error={fieldError || undefined}
          label={locale === "es" ? "Correo" : "Email"}
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <Input
          disabled={isLoading}
          label={locale === "es" ? "Clave" : "Password"}
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />

        {fieldError ? <p className="text-sm text-semantic-danger">{fieldError}</p> : null}

        <Button className="w-full" isLoading={isLoading} type="submit">
          {locale === "es" ? "Entrar" : "Sign in"}
        </Button>
      </form>
    </section>
  );
}
