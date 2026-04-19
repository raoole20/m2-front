"use client";

import { createBrowserTokenStore } from "@m2/api-client";
import { QueryClientProvider } from "@tanstack/react-query";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, type ReactNode, useEffect } from "react";

import { LocaleSwitcher } from "@m2/ui";

import { ToastProvider } from "../../../src/components/ToastProvider";
import { useAuth } from "../../../src/hooks/use-auth";
import { createQueryClient } from "../../../src/lib/query-client";
import { hasMinRole } from "../../../src/lib/roles";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname?.startsWith("/en") ? "en" : "es";
  const authState = useAuth();
  const queryClient = useMemo(() => createQueryClient(), []);
  const tokenStore = createBrowserTokenStore();

  useEffect(() => {
    if (pathname?.includes("/admin/login")) {
      return;
    }

    const token = tokenStore.getAccess();
    if (!token && !authState.isLoading) {
      router.replace(`/${locale === "es" ? "" : "en/"}admin/login`);
    }
  }, [authState.isLoading, locale, pathname, router, tokenStore]);

  const canSeeSettings = authState.user?.role ? hasMinRole(authState.user.role, "ADMIN") : false;

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider />
      <div className="min-h-screen">
        <header className="border-b border-stroke-subtle/60 bg-surface/80 px-4 py-3 backdrop-blur-xl">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <Link
                className="font-display font-bold text-text-primary"
                href={locale === "es" ? "/admin" : "/en/admin"}
              >
                m2 admin
              </Link>
              <Link
                className="text-sm text-text-secondary hover:text-text-primary"
                href={locale === "es" ? "/admin/inbox" : "/en/admin/inbox"}
              >
                Inbox
              </Link>
              <Link
                className="text-sm text-text-secondary hover:text-text-primary"
                href={locale === "es" ? "/admin/profile" : "/en/admin/profile"}
              >
                Profile
              </Link>
              {canSeeSettings ? (
                <span className="text-xs text-text-muted">Tenant settings</span>
              ) : null}
            </div>
            <LocaleSwitcher
              value={locale}
              onChange={(nextLocale) => {
                const current = pathname || "/admin";
                if (nextLocale === "es") {
                  router.push(current.replace("/en", "") || "/admin");
                  return;
                }
                if (current.startsWith("/en")) {
                  return;
                }
                router.push(`/en${current}`);
              }}
            />
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 py-8">{children}</main>
      </div>
    </QueryClientProvider>
  );
}
