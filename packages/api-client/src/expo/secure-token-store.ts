import * as SecureStore from "expo-secure-store";

import type { TokenStore, Tokens } from "../token-store";

const ACCESS_TOKEN_KEY = "m2_access_token";
const REFRESH_TOKEN_KEY = "m2_refresh_token";

export interface AsyncTokenStore {
  rehydrate(): Promise<void>;
  set(tokens: Tokens): Promise<void>;
  clear(): Promise<void>;
  /** Sync view satisfying the existing TokenStore — usable only after rehydrate(). */
  readonly sync: TokenStore;
}

export function createSecureTokenStore(): AsyncTokenStore {
  let accessToken: string | null = null;
  let refreshToken: string | null = null;
  let hydrated = false;

  const sync: TokenStore = {
    getAccess() {
      return accessToken;
    },
    getRefresh() {
      return refreshToken;
    },
    set(tokens) {
      accessToken = tokens.accessToken;
      refreshToken = tokens.refreshToken;
      void SecureStore.setItemAsync(ACCESS_TOKEN_KEY, tokens.accessToken);
      void SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refreshToken);
    },
    clear() {
      accessToken = null;
      refreshToken = null;
      void SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
      void SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    },
  };

  return {
    async rehydrate() {
      if (hydrated) return;
      const [storedAccess, storedRefresh] = await Promise.all([
        SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
        SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
      ]);
      accessToken = storedAccess;
      refreshToken = storedRefresh;
      hydrated = true;
    },
    async set(tokens) {
      accessToken = tokens.accessToken;
      refreshToken = tokens.refreshToken;
      await Promise.all([
        SecureStore.setItemAsync(ACCESS_TOKEN_KEY, tokens.accessToken),
        SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refreshToken),
      ]);
    },
    async clear() {
      accessToken = null;
      refreshToken = null;
      await Promise.all([
        SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
        SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
      ]);
    },
    sync,
  };
}
