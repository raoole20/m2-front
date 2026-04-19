import { fetcher } from "./fetcher";
import { setSessionSentinel, clearSessionSentinel } from "./session-cookie";
import type { Tokens } from "./token-store";

export type AuthUser = {
  id: string;
  name?: string;
  firstName?: string;
  email: string;
  role: "OWNER" | "ADMIN" | "AGENT";
};

export async function login(payload: { email: string; password: string }) {
  const data = await fetcher<{ accessToken: string; refreshToken: string; user: AuthUser }>(
    "/auth/login",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );

  setSessionSentinel();
  return data;
}

export async function refresh(payload: { refreshToken: string }) {
  return fetcher<Tokens>("/auth/refresh", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function me() {
  return fetcher<AuthUser>("/auth/me");
}

export async function logout() {
  clearSessionSentinel();

  try {
    await fetcher<unknown>("/auth/logout", {
      method: "POST",
      skipRefresh: true,
    });
  } catch {
    // Logout is best effort in v1.
  }
}
