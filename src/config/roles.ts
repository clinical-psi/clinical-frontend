export const ROLES = {
  ADMIN: "ADMIN",
  TENANT_ADMIN: "TENANT_ADMIN",
  SPECIALIST: "SPECIALIST",
  USER: "USER",
} as const;

export type RoleName = (typeof ROLES)[keyof typeof ROLES];

// Cuando un usuario tiene varios roles, gana el primero de esta lista.
export const ROLE_PRIORITY: RoleName[] = [
  ROLES.ADMIN,
  ROLES.TENANT_ADMIN,
  ROLES.SPECIALIST,
  ROLES.USER,
];

export function getPrimaryRole(roleNames: string[]): RoleName | null {
  return ROLE_PRIORITY.find((role) => roleNames.includes(role)) ?? null;
}

/**
 * Elige la implementación configurada para el rol principal del usuario.
 * Si el rol no tiene una entrada propia, se usa `default`.
 */
export function resolveByRole<T>(
  roleNames: string[],
  strategies: Partial<Record<RoleName, T>> & { default: T },
): T {
  const primary = getPrimaryRole(roleNames);
  return (primary && strategies[primary]) || strategies.default;
}
