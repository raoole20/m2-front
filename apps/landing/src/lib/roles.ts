export const ROLE_HIERARCHY = {
  OWNER: 3,
  ADMIN: 2,
  AGENT: 1,
} as const;

export type AppRole = keyof typeof ROLE_HIERARCHY;

export function hasMinRole(role: AppRole, required: AppRole) {
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[required];
}
