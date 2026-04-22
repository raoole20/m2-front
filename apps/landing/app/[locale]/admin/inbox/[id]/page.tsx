"use client";

import { conversations } from "@m2/api-client";
import { useQuery } from "@tanstack/react-query";
import { use } from "react";

export default function InboxDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const query = useQuery({
    queryKey: ["messages", id],
    queryFn: () => conversations.messages(id),
    enabled: Boolean(id),
    refetchInterval: 5000,
    refetchIntervalInBackground: false,
  });

  if (query.isLoading) {
    return <div className="h-24 animate-pulse rounded-xl bg-surface-container" />;
  }

  return (
    <section className="space-y-2">
      {query.data?.map((message) => (
        <div
          key={message.id}
          className={`max-w-[80%] rounded-xl px-4 py-2 text-sm ${
            message.direction === "outbound"
              ? "ml-auto bg-primary text-surface"
              : "bg-surface-container text-text-primary"
          }`}
        >
          {message.body}
        </div>
      ))}
    </section>
  );
}
