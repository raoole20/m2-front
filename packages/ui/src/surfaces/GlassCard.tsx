import * as React from "react";
import { clsx } from "clsx";

export type GlassCardProps = React.HTMLAttributes<HTMLDivElement>;

export function GlassCard({ className, ...props }: GlassCardProps) {
  return (
    <div
      className={clsx(
        "rounded-2xl border border-stroke-subtle bg-[rgba(32,31,31,0.65)] p-4 shadow-glow-primary backdrop-blur-xl",
        className,
      )}
      style={{
        boxShadow:
          "inset 1px 1px 0 rgba(173, 198, 255, 0.2), inset -1px -1px 0 rgba(173, 198, 255, 0.08)",
      }}
      {...props}
    />
  );
}
