import * as React from "react";
import { clsx } from "clsx";

export type SunkenInputProps = React.InputHTMLAttributes<HTMLInputElement>;

export function SunkenInput({ className, ...props }: SunkenInputProps) {
  return (
    <input
      className={clsx(
        "h-10 w-full rounded-lg border border-stroke-subtle bg-surface px-3 text-text-primary shadow-[inset_0_1px_2px_rgba(173,198,255,0.15)] outline-none focus:border-primary",
        className,
      )}
      {...props}
    />
  );
}
