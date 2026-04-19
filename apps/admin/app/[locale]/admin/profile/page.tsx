"use client";

import { auth } from "@m2/api-client";
import { useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";

import { useAuth } from "../../../../src/hooks/use-auth";

export default function ProfilePage() {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const { tokenStore, user } = useAuth();
  const locale = pathname?.startsWith("/en") ? "en" : "es";

  return (
    <section className="space-y-6 rounded-xl border border-stroke-subtle bg-surface-container/70 p-6">
      <h1 className="font-display text-2xl font-extrabold text-text-primary">Profile</h1>

      <dl className="grid gap-2 text-sm">
        <div>
          <dt className="text-text-muted">Name</dt>
          <dd className="text-text-primary">{user?.name || user?.firstName || "-"}</dd>
        </div>
        <div>
          <dt className="text-text-muted">Email</dt>
          <dd className="text-text-primary">{user?.email || "-"}</dd>
        </div>
        <div>
          <dt className="text-text-muted">Role</dt>
          <dd className="text-text-primary">{user?.role || "-"}</dd>
        </div>
      </dl>

      <button
        className="rounded-lg bg-semantic-danger px-4 py-2 text-sm font-semibold text-surface"
        onClick={async () => {
          tokenStore.clear();
          await auth.logout();
          queryClient.clear();
          router.replace(`/${locale === "es" ? "" : "en/"}admin/login`);
        }}
        type="button"
      >
        Cerrar sesion
      </button>
    </section>
  );
}
