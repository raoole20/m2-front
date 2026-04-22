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

export type RegisterPayload = {
  tenantName: string;
  tenantSlug: string;
  email: string;
  password: string;
  name: string;
};

export type RegisterResult = {
  message: string;
  userId: string;
  tenantSlug: string;
};

export async function login(payload: { email: string; password: string }) {
  const data = await fetcher<{ accessToken: string; refreshToken: string; user: AuthUser }>(
    "/auth/login",
    {
      method: "POST",
      body: JSON.stringify(payload),
      skipRefresh: true,
    },
  );

  setSessionSentinel();
  return data;
}

export async function register(payload: RegisterPayload) {
  return fetcher<RegisterResult>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function verifyEmail(payload: { token: string }) {
  return fetcher<{ message: string }>("/auth/verify-email", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function resendVerification(payload: { email: string; tenantSlug?: string }) {
  return fetcher<{ message: string }>("/auth/resend-verification", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function forgotPassword(payload: { email: string; tenantSlug?: string }) {
  return fetcher<{ message: string }>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function resetPassword(payload: { token: string; newPassword: string }) {
  return fetcher<{ message: string }>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
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
