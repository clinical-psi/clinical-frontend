import { useMemo } from "react";
import { useAuth } from "./useAuth";
import { ROLES, getPrimaryRole } from "../config/roles";
import {
  MENU_ITEMS,
  PERMISSIONS,
  hasAnyRole,
  type Permission,
} from "../config/permissions";

export function useRoles() {
  const { user } = useAuth();

  return useMemo(() => {
    const assigned = user?.roles?.map((role) => role.roleName) ?? [];
    // Sesiones sin roles (p. ej. guardadas antes de este cambio) se tratan como USER.
    const roleNames = assigned.length > 0 ? assigned : [ROLES.USER];
    const primaryRole = getPrimaryRole(roleNames);
    const can = (permission: Permission) =>
      hasAnyRole(roleNames, PERMISSIONS[permission]);
    const menuItems = MENU_ITEMS.filter((item) =>
      hasAnyRole(roleNames, item.roles),
    );

    return {
      roleNames,
      primaryRole,
      isAdmin:
        primaryRole === ROLES.ADMIN || primaryRole === ROLES.TENANT_ADMIN,
      isSpecialist: primaryRole === ROLES.SPECIALIST,
      can,
      menuItems,
    };
  }, [user]);
}
