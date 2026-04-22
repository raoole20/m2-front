export const LOGIN_SUCCESS = {
  success: true,
  data: {
    accessToken: "test-access-token",
    refreshToken: "test-refresh-token",
    user: { id: "user-1", email: "andrea@milacafe.mx", role: "OWNER" },
  },
};

export const REGISTER_SUCCESS = {
  success: true,
  data: {
    userId: "user-1",
    tenantSlug: "mila-cafe",
    message: "Account created. Check your email to verify before logging in.",
  },
};

export const ERROR_UNAUTHORIZED = {
  success: false,
  error: { code: "UNAUTHORIZED", message: "Invalid credentials" },
};

export const ERROR_EMAIL_NOT_VERIFIED = {
  success: false,
  error: { code: "UNAUTHORIZED", message: "EMAIL_NOT_VERIFIED" },
};

export const ERROR_CONFLICT = {
  success: false,
  error: { code: "CONFLICT", message: "A tenant with this slug already exists" },
};
