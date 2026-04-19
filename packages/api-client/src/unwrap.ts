import { ApiError } from "./errors";

export type Envelope<T> =
  | {
      success: true;
      data: T;
      meta?: Record<string, unknown>;
    }
  | {
      success: false;
      error: {
        code: string;
        message: string;
        details?: unknown;
      };
    };

export function unwrap<T>(envelope: Envelope<T>): T {
  if (envelope.success) {
    return envelope.data;
  }

  throw new ApiError(envelope.error.code, envelope.error.message, envelope.error.details);
}
