"use client";

import { conversations } from "@m2/api-client";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { ConversationCard, FilterTab } from "@m2/ui";

const filters = ["all", "open", "pending", "resolved"] as const;

export default function InboxPage() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const locale = pathname?.startsWith("/en") ? "en" : "es";
  const active = (params?.get("status") as (typeof filters)[number] | null) || "all";

  const query = useQuery({
    queryKey: ["conversations", active],
    queryFn: () => conversations.list(active === "all" ? undefined : { status: active }),
    refetchInterval: 5000,
    refetchIntervalInBackground: false,
  });

  const list = query.data || [];

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {filters.map((status) => (
          <FilterTab
            key={status}
            active={active === status}
            onClick={() => {
              const qp = new URLSearchParams(params?.toString());
              if (status === "all") {
                qp.delete("status");
              } else {
                qp.set("status", status);
              }
              const next = qp.toString();
              router.push(next ? `${pathname}?${next}` : pathname || "/admin/inbox");
            }}
          >
            {status}
          </FilterTab>
        ))}
      </div>

      {query.isLoading ? (
        <div className="grid gap-3">
          <div className="h-24 animate-pulse rounded-xl bg-surface-container" />
          <div className="h-24 animate-pulse rounded-xl bg-surface-container" />
          <div className="h-24 animate-pulse rounded-xl bg-surface-container" />
        </div>
      ) : null}

      {!query.isLoading && list.length === 0 ? (
        <div className="rounded-xl border border-stroke-subtle bg-surface-container p-6 text-sm text-text-secondary">
          No hay conversaciones aun.
        </div>
      ) : null}

      <div className="grid gap-3">
        {list.map((item) => (
          <Link
            key={item.id}
            href={locale === "es" ? `/admin/inbox/${item.id}` : `/en/admin/inbox/${item.id}`}
          >
            <ConversationCard preview={item.id} status={item.status} title={item.title} />
          </Link>
        ))}
      </div>
    </section>
  );
}
