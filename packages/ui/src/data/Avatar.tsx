import * as React from "react";
import { clsx } from "clsx";

export type AvatarProps = {
  name: string;
  className?: string;
};

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function Avatar({ name, className }: AvatarProps) {
  return (
    <div
      aria-label={name}
      className={clsx(
        "flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-high text-xs font-semibold text-text-primary shadow-glow-secondary",
        className,
      )}
    >
      {getInitials(name)}
    </div>
  );
}
