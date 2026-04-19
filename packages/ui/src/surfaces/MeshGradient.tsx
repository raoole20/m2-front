import * as React from "react";
import { clsx } from "clsx";

export type MeshGradientProps = {
  variant?: "primary" | "dusk";
  className?: string;
};

export function MeshGradient({ variant = "primary", className }: MeshGradientProps) {
  const bg = variant === "dusk" ? "bg-mesh-dusk" : "bg-mesh-primary";
  return <div aria-hidden className={clsx("absolute inset-0 -z-10 opacity-70", bg, className)} />;
}
