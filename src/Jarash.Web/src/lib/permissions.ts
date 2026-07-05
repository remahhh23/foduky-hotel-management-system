import { useAuth } from "./auth-context";

const USERS_KEY = "jarash_settings_users";
const ROLES_KEY = "jarash_settings_roles";

export interface AppUser {
  id: string;
  username: string;
  password: string;
  displayName: string;
  role: string;
  active: boolean;
  createdAt: string;
}

export interface Role {
  id: string;
  name: string;
  permissions: string[];
}

const ALL_PERMISSIONS = [
  "إدارة المخازن", "إدارة المشتريات", "إدارة النقد", "إدارة الحسابات",
  "إدارة الفندق", "التقارير المالية", "التقارير الصندوقية", "التقارير النقدية",
  "تقارير المخازن", "تقارير الأرباح", "الإعدادات", "المستخدمين",
  "عرض فقط", "إضافة", "تعديل", "حذف", "طباعة",
] as const;

export type Permission = (typeof ALL_PERMISSIONS)[number];

function readUsers(): AppUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function readRoles(): Role[] {
  try {
    const raw = localStorage.getItem(ROLES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function getUserPermissions(username: string | undefined): Permission[] {
  if (!username) return [];
  const users = readUsers();
  const user = users.find((u) => u.username === username && u.active);
  if (!user) return [];
  const roles = readRoles();
  const role = roles.find((r) => r.name === user.role);
  return (role?.permissions ?? []) as Permission[];
}

export function usePermission(): {
  can: (permission: Permission) => boolean;
  userRole: string;
  permissions: Permission[];
} {
  const { user } = useAuth();
  const permissions = getUserPermissions(user?.username);
  const users = readUsers();
  const appUser = users.find((u) => u.username === user?.username);
  return {
    can: (permission: Permission) => permissions.includes(permission),
    userRole: appUser?.role ?? "مستخدم",
    permissions,
  };
}
