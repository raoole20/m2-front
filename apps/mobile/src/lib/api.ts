import {
  auth,
  channels,
  conversations,
  MissingApiUrlError,
  setTokenStore,
} from '@m2/api-client';
import { createSecureTokenStore } from '@m2/api-client/expo';

const baseUrl = process.env.EXPO_PUBLIC_API_URL;
if (!baseUrl) {
  throw new MissingApiUrlError();
}

export const tokenStore = createSecureTokenStore();

export const apiClient = {
  auth,
  channels,
  conversations,
};

/**
 * Rehydrate the secure token store from `expo-secure-store` and wire it into
 * the api-client fetcher. MUST be awaited before any networked render.
 */
export async function bootstrapApi(): Promise<void> {
  await tokenStore.rehydrate();
  setTokenStore(tokenStore.sync);
}
