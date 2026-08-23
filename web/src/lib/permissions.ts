export type StaffRole = "owner" | "manager" | "staff";

export type Permission =
  | "canManageBilling"
  | "canManageShops"
  | "canDeleteShop"
  | "canInviteTeamMembers"
  | "canManageTeam"
  | "canManageProducts"
  | "canManageOrders"
  | "canManageCustomers"
  | "canViewAnalytics"
  | "canUpdateStock"
  | "canViewOrders"
  | "canViewProducts"
  | "canViewCustomers";

const ROLE_PERMISSIONS: Record<StaffRole, Permission[]> = {
  owner: [
    "canManageBilling",
    "canManageShops",
    "canDeleteShop",
    "canInviteTeamMembers",
    "canManageTeam",
    "canManageProducts",
    "canManageOrders",
    "canManageCustomers",
    "canViewAnalytics",
    "canUpdateStock",
    "canViewOrders",
    "canViewProducts",
    "canViewCustomers",
  ],
  manager: [
    "canManageProducts",
    "canManageOrders",
    "canManageCustomers",
    "canViewAnalytics",
    "canUpdateStock",
    "canViewOrders",
    "canViewProducts",
    "canViewCustomers",
  ],
  staff: [
    "canViewOrders",
    "canViewProducts",
    "canViewCustomers",
    "canUpdateStock",
  ],
};

export function hasPermission(role: StaffRole | string, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role as StaffRole]?.includes(permission) ?? false;
}

export function getPermissions(role: StaffRole | string): Permission[] {
  return [...(ROLE_PERMISSIONS[role as StaffRole] ?? [])];
}

export const ROLE_LABELS: Record<StaffRole, string> = {
  owner:   "Propriétaire",
  manager: "Manager",
  staff:   "Employé",
};

export const ROLE_DESCRIPTIONS: Record<StaffRole, string> = {
  owner:   "Accès complet : boutiques, abonnement et équipe",
  manager: "Gestion opérationnelle : produits, commandes, clients, stats",
  staff:   "Accès limité : consultation et mise à jour du stock et des statuts",
};
