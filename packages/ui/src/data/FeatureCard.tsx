import * as React from "react";
import { GlassCard } from "../surfaces/GlassCard";

export type FeatureCardProps = {
  title: string;
  description: string;
};

export function FeatureCard({ title, description }: FeatureCardProps) {
  return (
    <GlassCard className="space-y-2">
      <h3 className="font-display text-lg font-bold text-text-primary">{title}</h3>
      <p className="text-sm text-text-secondary">{description}</p>
    </GlassCard>
  );
}
