import { ForbiddenError, NetworkError, ServerError, UnauthorizedError } from "@m2/api-client";

export function mapApiErrorToToast(error: unknown): { message: string } | null {
  if (error instanceof ForbiddenError) {
    return { message: "No tienes permiso" };
  }

  if (error instanceof ServerError) {
    return { message: "Error del servidor" };
  }

  if (error instanceof NetworkError) {
    return { message: "Sin conexion" };
  }

  if (error instanceof UnauthorizedError) {
    return { message: "Sesión expirada. Inicia sesión nuevamente" };
  }

  return null;
}
