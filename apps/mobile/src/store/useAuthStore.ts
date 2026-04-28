import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

import { apiClient, tokenStore } from '@/lib/api';
import { ROLE_HIERARCHY, type UserRole, type UserStatus } from '@m2/types';

const AUTH_USER_KEY = 'motomoto_auth_user';

/**
 * The user object persisted on the mobile client. Tokens are stored
 * separately in the secure token store; this object only carries the
 * identity / role information surfaced to the UI.
 */
export type MobileAuthUser = {
  id: string;
  email: string;
  /** Backend may return either `name` or `firstName`; keep both for callers. */
  name?: string;
  firstName?: string;
  role: UserRole;
  /** Optional fields surfaced by legacy V1 screens (e.g. profile avatar / presence). */
  avatarUrl?: string;
  status?: UserStatus;
};

interface AuthState {
  user: MobileAuthUser | null;
  isAuthenticated: boolean;
  hasMinRole: (minRole: UserRole) => boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  /** Rehydrate auth state from the secure token store + secure-store user blob. */
  rehydrate: () => Promise<void>;
}

/**
 * Map a backend `AuthUser.role` (OWNER / ADMIN / AGENT) onto the local
 * `UserRole` taxonomy (agent / manager / admin) used by `ROLE_HIERARCHY`
 * and `hasMinRole`.
 */
function normalizeRole(role: string): UserRole {
  const upper = role.toUpperCase();
  if (upper === 'OWNER') return 'admin';
  if (upper === 'ADMIN') return 'manager';
  return 'agent';
}

type ApiAuthUser = {
  id: string;
  email: string;
  name?: string;
  firstName?: string;
  role: string;
};

function toMobileAuthUser(input: ApiAuthUser): MobileAuthUser {
  return {
    id: input.id,
    email: input.email,
    name: input.name,
    firstName: input.firstName,
    role: normalizeRole(input.role),
  };
}

async function persistUser(user: MobileAuthUser): Promise<void> {
  await SecureStore.setItemAsync(AUTH_USER_KEY, JSON.stringify(user));
}

async function readPersistedUser(): Promise<MobileAuthUser | null> {
  const raw = await SecureStore.getItemAsync(AUTH_USER_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as MobileAuthUser;
    if (typeof parsed?.id !== 'string' || typeof parsed?.email !== 'string') {
      await SecureStore.deleteItemAsync(AUTH_USER_KEY);
      return null;
    }
    return parsed;
  } catch {
    await SecureStore.deleteItemAsync(AUTH_USER_KEY);
    return null;
  }
}

async function clearPersistedUser(): Promise<void> {
  await SecureStore.deleteItemAsync(AUTH_USER_KEY);
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,

  hasMinRole: (minRole: UserRole): boolean => {
    const { user } = get();
    if (!user) return false;
    return ROLE_HIERARCHY[user.role] >= ROLE_HIERARCHY[minRole];
  },

  signInWithEmail: async (email: string, password: string) => {
    const { accessToken, refreshToken, user: apiUser } = await apiClient.auth.login({
      email,
      password,
    });
    await tokenStore.set({ accessToken, refreshToken });
    const user = toMobileAuthUser(apiUser);
    await persistUser(user);
    set({ user, isAuthenticated: true });
  },

  signOut: async () => {
    try {
      await apiClient.auth.logout();
    } catch {
      // Logout is best-effort; the user is signed out locally regardless.
    }
    await tokenStore.clear();
    await clearPersistedUser();
    set({ user: null, isAuthenticated: false });
  },

  rehydrate: async () => {
    await tokenStore.rehydrate();
    const access = tokenStore.sync.getAccess();
    if (!access) {
      // No usable tokens — make sure no orphan user blob lingers.
      await clearPersistedUser();
      set({ user: null, isAuthenticated: false });
      return;
    }

    let user = await readPersistedUser();
    if (!user) {
      try {
        const apiUser = await apiClient.auth.me();
        user = toMobileAuthUser(apiUser);
        await persistUser(user);
      } catch {
        // /auth/me failed — drop tokens to force re-login.
        await tokenStore.clear();
        await clearPersistedUser();
        set({ user: null, isAuthenticated: false });
        return;
      }
    }

    set({ user, isAuthenticated: true });
  },
}));
