import * as React from "react";
import { clsx } from "clsx";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export function Input({ id, label, error, className, ...props }: InputProps) {
  const inputId = id ?? React.useId();
  const errorId = `${inputId}-error`;

  return (
    <label
      className="flex w-full flex-col gap-2 font-body text-sm text-text-primary"
      htmlFor={inputId}
    >
      {label}
      <input
        id={inputId}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className={clsx(
          "h-10 rounded-lg border border-stroke-subtle bg-surface-container px-3 text-text-primary outline-none focus:border-primary",
          className,
        )}
        {...props}
      />
      {error ? (
        <span id={errorId} className="text-xs text-semantic-danger" role="alert">
          {error}
        </span>
      ) : null}
    </label>
  );
}
