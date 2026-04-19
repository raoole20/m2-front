const ACCESS_TOKEN_KEY = "m2_access_token";
const REFRESH_TOKEN_KEY = "m2_refresh_token";

export type Tokens = {
  accessToken: string;
  refreshToken: string;
};

export interface TokenStore {
  getAccess(): string | null;
  getRefresh(): string | null;
  set(tokens: Tokens): void;
  clear(): void;
}

export function createBrowserTokenStore(): TokenStore {
  const hasStorage = typeof window !== "undefined" && typeof localStorage !== "undefined";

  return {
    getAccess() {
      return hasStorage ? localStorage.getItem(ACCESS_TOKEN_KEY) : null;
    },
    getRefresh() {
      return hasStorage ? localStorage.getItem(REFRESH_TOKEN_KEY) : null;
    },
    set(tokens) {
      if (!hasStorage) {
        return;
      }

      localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
    },
    clear() {
      if (!hasStorage) {
        return;
      }

      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    },
  };
}
