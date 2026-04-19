import * as React from "react";
import { clsx } from "clsx";

export type GradientButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

export function GradientButton({ className, ...props }: GradientButtonProps) {
  return (
    <button
      className={clsx(
        "h-11 rounded-lg px-5 font-body text-sm font-medium text-surface shadow-glow-primary transition disabled:opacity-50",
        className,
      )}
      style={{ background: "linear-gradient(135deg, #1A2A4A, #ADC6FF)" }}
      {...props}
    />
  );
}
