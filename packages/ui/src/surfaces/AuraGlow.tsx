import * as React from "react";
import { clsx } from "clsx";

export type AuraGlowProps = {
  className?: string;
};

export function AuraGlow({ className }: AuraGlowProps) {
  return (
    <div
      aria-hidden
      className={clsx(
        "pointer-events-none absolute inset-0 -z-10 rounded-full bg-primary/20 blur-3xl",
        className,
      )}
    />
  );
}
