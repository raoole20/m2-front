"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Admin Error]", error);
  }, [error]);

  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-8 text-center">
      <h1 className="text-2xl font-semibold text-gray-900">Algo salió mal</h1>
      <p className="text-gray-500 max-w-sm">
        Ocurrió un error inesperado. Puedes intentar recargar la página o volver
        al inicio.
      </p>
      {error.digest && (
        <p className="text-xs text-gray-400 font-mono">Código: {error.digest}</p>
      )}
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="px-4 py-2 rounded bg-gray-900 text-white text-sm hover:bg-gray-700"
        >
          Reintentar
        </button>
        <button
          onClick={() => router.push("/")}
          className="px-4 py-2 rounded border text-sm hover:bg-gray-50"
        >
          Ir al inicio
        </button>
      </div>
    </div>
  );
}
