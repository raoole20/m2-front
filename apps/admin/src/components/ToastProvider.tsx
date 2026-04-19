"use client";

import { useEffect, useState } from "react";

import { subscribeToToasts, type ToastPayload } from "../lib/toast-bus";

export function ToastProvider() {
  const [toasts, setToasts] = useState<ToastPayload[]>([]);

  useEffect(() => {
    return subscribeToToasts((payload) => {
      setToasts((current) => [...current, payload]);
      const id = payload.id;
      if (!id) {
        return;
      }

      setTimeout(() => {
        setToasts((current) => current.filter((toast) => toast.id !== id));
      }, 3000);
    });
  }, []);

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed right-4 top-4 z-50 flex w-full max-w-sm flex-col gap-2"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto rounded-lg border border-stroke-subtle bg-surface-container px-4 py-3 text-sm text-text-primary shadow-glow-secondary"
          role="status"
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
