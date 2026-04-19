export class ApiError extends Error {
  code: string;
  details?: unknown;

  constructor(code: string, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.details = details;
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = "Unauthorized", details?: unknown) {
    super("UNAUTHORIZED", message, details);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = "Forbidden", details?: unknown) {
    super("FORBIDDEN", message, details);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends ApiError {
  constructor(message = "Not found", details?: unknown) {
    super("NOT_FOUND", message, details);
    this.name = "NotFoundError";
  }
}

export class ServerError extends ApiError {
  constructor(message = "Server error", details?: unknown) {
    super("SERVER_ERROR", message, details);
    this.name = "ServerError";
  }
}

export class NetworkError extends ApiError {
  constructor(message = "Network error", details?: unknown) {
    super("NETWORK_ERROR", message, details);
    this.name = "NetworkError";
  }
}
