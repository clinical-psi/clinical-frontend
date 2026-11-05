import { ROLES, type RoleName } from "./roles";
import type { FeatureFlag } from "./features";

export type MenuItemId =
  | "patients"
  | "specialists"
  | "appointments"
  | "availability"
  | "settings";

export type MenuItem = {
  id: MenuItemId;
  label: string;
  icon: string;
  /** Roles que ven el menú. Vacío = todos los usuarios autenticados. */
  roles: RoleName[];
  /** Si se define, el menú solo aparece con el flag habilitado. */
  feature?: FeatureFlag;
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
  {
    id: "appointments",
    label: "Citas",
    icon: "C",
    roles: [],
    feature: "scheduling",
  },
  {
    id: "availability",
    label: "Mi disponibilidad",
    icon: "D",
    roles: [],
    feature: "scheduling",
  },
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
  "availability.manage": ADMINS,
  "availability.view": [...ADMINS, ROLES.SPECIALIST],
  "settings.changePassword": [...STAFF, ROLES.SPECIALIST],
} satisfies Record<string, RoleName[]>;

export type Permission = keyof typeof PERMISSIONS;

export function hasAnyRole(roleNames: string[], allowed: RoleName[]) {
  return allowed.length === 0 || allowed.some((r) => roleNames.includes(r));
}
