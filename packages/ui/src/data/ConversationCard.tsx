import * as React from "react";
import { GlassCard } from "../surfaces/GlassCard";

export type ConversationCardProps = {
  title: string;
  preview: string;
  status: "open" | "pending" | "resolved";
};

export function ConversationCard({ title, preview, status }: ConversationCardProps) {
  return (
    <GlassCard className="space-y-1">
      <p className="font-body text-sm font-semibold text-text-primary">{title}</p>
      <p className="text-xs text-text-secondary">{preview}</p>
      <p className="text-[10px] uppercase tracking-wide text-tertiary">{status}</p>
    </GlassCard>
  );
}
