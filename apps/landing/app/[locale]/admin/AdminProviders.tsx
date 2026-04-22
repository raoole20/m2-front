"use client";

import { createBrowserTokenStore } from "@m2/api-client";
import { QueryClientProvider } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, type ReactNode, useEffect } from "react";

import { ToastProvider } from "../../../src/components/ToastProvider";
import { useAuth } from "../../../src/hooks/use-auth";
import { createQueryClient } from "../../../src/lib/query-client";

const AUTH_ROUTES = ["/login", "/register", "/recover", "/2fa", "/onboarding"];

function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some((route) => pathname.includes(`/admin${route}`));
}

function adminLoginPath(locale: "es" | "en"): string {
  return locale === "es" ? "/admin/login" : "/en/admin/login";
}

function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const locale = pathname.startsWith("/en") ? "en" : "es";
  const authState = useAuth();
  const tokenStore = useMemo(() => createBrowserTokenStore(), []);

  useEffect(() => {
    if (isAuthRoute(pathname)) return;

    const token = tokenStore.getAccess();
    if (!token && !authState.isLoading) {
      router.replace(adminLoginPath(locale));
    }
  }, [authState.isLoading, locale, pathname, router, tokenStore]);

  return <>{children}</>;
}

export function AdminProviders({ children }: { children: ReactNode }) {
  const queryClient = useMemo(() => createQueryClient(), []);

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider />
      <AuthGuard>{children}</AuthGuard>
    </QueryClientProvider>
  );
}
