import {
  ApiError,
  ForbiddenError,
  NetworkError,
  NotFoundError,
  ServerError,
  UnauthorizedError,
} from "./errors";
import { clearSessionSentinel } from "./session-cookie";
import type { TokenStore } from "./token-store";
import { unwrap, type Envelope } from "./unwrap";

const publicEnv = globalThis as {
  process?: {
    env?: {
      NEXT_PUBLIC_API_URL?: string;
    };
  };
};

const baseUrl = publicEnv.process?.env?.NEXT_PUBLIC_API_URL;

if (!baseUrl) {
  throw new Error("NEXT_PUBLIC_API_URL missing");
}

let tokenStore: TokenStore | null = null;
let refreshing: Promise<void> | null = null;

export function setTokenStore(store: TokenStore) {
  tokenStore = store;
}

type FetcherOptions = RequestInit & {
  skipRefresh?: boolean;
};

async function runRefresh() {
  if (!tokenStore) {
    throw new UnauthorizedError();
  }

  const refreshToken = tokenStore.getRefresh();
  if (!refreshToken) {
    throw new UnauthorizedError();
  }

  const response = await fetch(`${baseUrl}/auth/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    throw new UnauthorizedError();
  }

  const payload = (await response.json()) as Envelope<{
    accessToken: string;
    refreshToken: string;
  }>;

  const refreshed = unwrap(payload);
  tokenStore.set(refreshed);
}

function handleAuthFailure() {
  tokenStore?.clear();
  clearSessionSentinel();

  if (typeof window !== "undefined") {
    window.location.assign("/admin/login?reason=expired");
  }
}

export async function fetcher<T>(path: string, init: FetcherOptions = {}): Promise<T> {
  const headers = new Headers(init.headers || {});

  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }

  const accessToken = tokenStore?.getAccess();
  if (accessToken && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  let response: Response;

  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers,
    });
  } catch (error) {
    throw new NetworkError("Network request failed", error);
  }

  if (response.status === 401 && !init.skipRefresh) {
    try {
      if (!refreshing) {
        refreshing = runRefresh().finally(() => {
          refreshing = null;
        });
      }

      await refreshing;
      return fetcher<T>(path, { ...init, skipRefresh: true });
    } catch {
      handleAuthFailure();
      throw new UnauthorizedError();
    }
  }

  if (response.status === 403) {
    throw new ForbiddenError("Forbidden");
  }

  if (response.status === 404) {
    throw new NotFoundError("Not found");
  }

  if (response.status >= 500) {
    throw new ServerError("Server error");
  }

  const json = (await response.json()) as Envelope<T>;

  try {
    return unwrap(json);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError("UNKNOWN_ERROR", "Unknown error", error);
  }
}
