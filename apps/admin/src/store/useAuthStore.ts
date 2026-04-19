import { create } from "zustand";

import type { auth } from "@m2/api-client";

type AuthUser = Awaited<ReturnType<typeof auth.me>>;

type AuthState = {
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}));
