import * as React from "react";
import { GlassCard } from "../surfaces/GlassCard";

export type KPICardProps = {
  label: string;
  value: string;
  trend?: string;
};

export function KPICard({ label, value, trend }: KPICardProps) {
  return (
    <GlassCard className="space-y-2">
      <p className="text-xs text-text-secondary">{label}</p>
      <p className="font-display text-2xl font-bold text-text-primary">{value}</p>
      {trend ? <p className="text-xs text-semantic-success">{trend}</p> : null}
    </GlassCard>
  );
}
