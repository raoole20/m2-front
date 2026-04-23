"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es">
      <body>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 24,
            padding: 32,
            textAlign: "center",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <h1 style={{ fontSize: 24, fontWeight: 600, margin: 0 }}>
            Error crítico
          </h1>
          <p style={{ color: "#6b7280", maxWidth: 360, margin: 0 }}>
            La aplicación encontró un error inesperado. Por favor recarga la
            página.
          </p>
          {error.digest && (
            <p style={{ color: "#9ca3af", fontSize: 12, fontFamily: "monospace" }}>
              Código: {error.digest}
            </p>
          )}
          <button
            onClick={reset}
            style={{
              padding: "8px 20px",
              background: "#111827",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            Recargar
          </button>
        </div>
      </body>
    </html>
  );
}
