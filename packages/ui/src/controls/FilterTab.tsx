import * as React from "react";
import { clsx } from "clsx";

export type FilterTabProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
};

export function FilterTab({ active, className, ...props }: FilterTabProps) {
  return (
    <button
      className={clsx(
        "rounded-full px-4 py-2 text-xs font-medium transition",
        active
          ? "bg-primary text-surface shadow-glow-primary"
          : "bg-surface-container text-text-secondary",
        className,
      )}
      {...props}
    />
  );
}
