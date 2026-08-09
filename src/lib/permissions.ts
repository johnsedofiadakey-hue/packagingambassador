import type { StaffMember, StaffRole } from "@/lib/store";

/**
 * Page/tab access model. Admins always have everything. Other staff are granted a set of
 * pages when their account is created; `staff` and `settings` (and the activity log) stay
 * Admin-only and are never grantable, and `dashboard` is always allowed as a safe landing.
 */
export type PermissionKey =
  | "pos"
  | "orders"
  | "sales"
  | "products"
  | "inventory"
  | "categories"
  | "customers"
  | "analytics"
  | "reconciliation"
  | "blog";

/** The pages an admin can tick on/off when creating or editing a staff member. */
export const GRANTABLE_PERMISSIONS: { key: PermissionKey; label: string }[] = [
  { key: "pos", label: "Point of Sale" },
  { key: "orders", label: "Orders" },
  { key: "sales", label: "Sales Records" },
  { key: "products", label: "Products" },
  { key: "inventory", label: "Inventory" },
  { key: "categories", label: "Categories" },
  { key: "customers", label: "Business Customers" },
  { key: "analytics", label: "Analytics" },
  { key: "reconciliation", label: "Reconciliation" },
  { key: "blog", label: "Blog" },
];

const ALL_KEYS = GRANTABLE_PERMISSIONS.map((p) => p.key);

/** Applied to staff created before granular permissions existed (no `permissions` field yet). */
export const ROLE_DEFAULT_PERMISSIONS: Record<StaffRole, PermissionKey[]> = {
  Admin: ALL_KEYS,
  "Sales Staff": ["pos", "orders", "sales", "products", "customers"],
  "Inventory Staff": ["orders", "products", "inventory", "categories"],
};

export function permissionsFor(staff: Pick<StaffMember, "role" | "permissions">): PermissionKey[] {
  if (staff.role === "Admin") return ALL_KEYS;
  const explicit = staff.permissions as PermissionKey[] | undefined;
  return explicit && explicit.length >= 0 && staff.permissions !== undefined
    ? explicit.filter((k): k is PermissionKey => ALL_KEYS.includes(k as PermissionKey))
    : ROLE_DEFAULT_PERMISSIONS[staff.role];
}

/** `dashboard` is always allowed; `staff`/`settings`/`activity` are Admin-only. */
export function hasPermission(
  staff: Pick<StaffMember, "role" | "permissions">,
  key: PermissionKey | "dashboard" | "staff" | "settings" | "activity"
): boolean {
  if (staff.role === "Admin") return true;
  if (key === "dashboard") return true;
  if (key === "staff" || key === "settings" || key === "activity") return false;
  return permissionsFor(staff).includes(key);
}

/** Where a staff member lands after login — their sell screen if allowed, else the dashboard. */
export function staffHome(staff: Pick<StaffMember, "role" | "permissions">): string {
  return hasPermission(staff, "pos") ? "/admin/pos" : "/admin/dashboard";
}
