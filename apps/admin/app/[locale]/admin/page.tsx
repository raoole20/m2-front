"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { KPICard } from "@m2/ui";

import { useAuth } from "../../../src/hooks/use-auth";
import { MOCK_DASHBOARD_KPIS } from "../../../src/mock/dashboard";

export default function AdminHomePage() {
  const { user } = useAuth();
  const pathname = usePathname();
  const locale = pathname?.startsWith("/en") ? "en" : "es";

  return (
    <section className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-extrabold text-text-primary">
          {user?.firstName ? `Hola, ${user.firstName}` : "Hola"}
        </h1>
        <p className="text-sm text-text-secondary">Panel ejecutivo de conversaciones</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {MOCK_DASHBOARD_KPIS.map((kpi) => (
          <KPICard key={kpi.label} label={kpi.label} trend={kpi.trend} value={kpi.value} />
        ))}
      </div>

      <div className="flex gap-3">
        <Link
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-surface"
          href={locale === "es" ? "/admin/inbox" : "/en/admin/inbox"}
        >
          Ir a inbox
        </Link>
        <Link
          className="rounded-lg border border-stroke-subtle px-4 py-2 text-sm text-text-primary"
          href={locale === "es" ? "/admin/profile" : "/en/admin/profile"}
        >
          Ver perfil
        </Link>
      </div>
    </section>
  );
}
