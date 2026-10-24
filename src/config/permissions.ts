import { ROLES, type RoleName } from "./roles";

export type MenuItemId = "patients" | "specialists" | "appointments" | "settings";

export type MenuItem = {
  id: MenuItemId;
  label: string;
  icon: string;
  /** Roles que ven el menú. Vacío = todos los usuarios autenticados. */
  roles: RoleName[];
};

const ADMINS: RoleName[] = [ROLES.ADMIN, ROLES.TENANT_ADMIN];
const STAFF: RoleName[] = [...ADMINS, ROLES.USER];

export const MENU_ITEMS: MenuItem[] = [
  {
    id: "patients",
    label: "Pacientes",
    icon: "P",
    roles: [...STAFF, ROLES.SPECIALIST],
  },
  { id: "specialists", label: "Especialistas", icon: "E", roles: STAFF },
  { id: "appointments", label: "Citas", icon: "C", roles: STAFF },
  { id: "settings", label: "Configuración", icon: "⚙", roles: STAFF },
];

export const PERMISSIONS = {
  "clinical.read": [ROLES.TENANT_ADMIN, ROLES.SPECIALIST],
  "clinical.write": [ROLES.SPECIALIST],
  "patients.create": [...STAFF, ROLES.SPECIALIST],
  "patients.edit": [...STAFF, ROLES.SPECIALIST],
  "patients.deactivate": STAFF,
  "patients.assignSpecialist": STAFF,
  "settings.users": ADMINS,
  "settings.changePassword": [...STAFF, ROLES.SPECIALIST],
} satisfies Record<string, RoleName[]>;

export type Permission = keyof typeof PERMISSIONS;

export function hasAnyRole(roleNames: string[], allowed: RoleName[]) {
  return allowed.length === 0 || allowed.some((r) => roleNames.includes(r));
}
