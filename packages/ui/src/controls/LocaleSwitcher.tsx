import * as React from "react";

export type LocaleSwitcherProps = {
  value: "es" | "en";
  onChange: (locale: "es" | "en") => void;
};

export function LocaleSwitcher({ value, onChange }: LocaleSwitcherProps) {
  return (
    <select
      aria-label="Locale"
      className="h-9 rounded-lg border border-stroke-subtle bg-surface-container px-2 text-xs text-text-primary"
      value={value}
      onChange={(event) => onChange(event.target.value as "es" | "en")}
    >
      <option value="es">ES</option>
      <option value="en">EN</option>
    </select>
  );
}
