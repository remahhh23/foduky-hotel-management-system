import { useState, useEffect } from "react";
import { ArrowLeft, Plus, Pencil, Trash2, Save, X, Shield, UserCheck, UserX } from "lucide-react";
import { logger } from "@/lib/logger";
import { hashPassword } from "@/lib/crypto";
import { usePermission } from "@/lib/permissions";
import ProtectedSection from "@/lib/ProtectedSection";
import type { AppUser as AppUserType, Role } from "@/lib/permissions";

interface Props {
  onBack: () => void;
}

const USERS_KEY = "jarash_settings_users";
const ROLES_KEY = "jarash_settings_roles";

const allPermissions = [
  "إدارة المخازن", "إدارة المشتريات", "إدارة النقد", "إدارة الحسابات",
  "إدارة الفندق", "التقارير المالية", "التقارير الصندوقية", "التقارير النقدية",
  "تقارير المخازن", "تقارير الأرباح", "الإعدادات", "المستخدمين",
  "عرض فقط", "إضافة", "تعديل", "حذف", "طباعة",
];

function readUsers(): AppUserType[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function writeUsers(data: AppUserType[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(data));
}

function readRoles(): Role[] {
  try {
    const raw = localStorage.getItem(ROLES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function writeRoles(data: Role[]) {
  localStorage.setItem(ROLES_KEY, JSON.stringify(data));
}

let idCounter = Date.now();
function nextId(): string { return `usr_${++idCounter}`; }

async function seedDefaultData() {
  const users = readUsers();
  if (users.length === 0) {
    const hashedPassword = await hashPassword("admin123");
    const admins: AppUserType[] = [
      { id: nextId(), username: "admin", password: hashedPassword, displayName: "مدير النظام", role: "مدير", active: true, createdAt: new Date().toISOString() },
    ];
    writeUsers(admins);
    return admins;
  }
  return users;
}

function seedDefaultRoles(): Role[] {
  const roles = readRoles();
  if (roles.length === 0) {
    const defaultRoles: Role[] = [
      { id: nextId(), name: "مدير", permissions: [...allPermissions] },
      { id: nextId(), name: "مستخدم", permissions: ["عرض فقط"] },
      { id: nextId(), name: "محاسب", permissions: ["إدارة الحسابات", "التقارير المالية", "التقارير الصندوقية", "التقارير النقدية", "عرض فقط"] },
      { id: nextId(), name: "مستودعات", permissions: ["إدارة المخازن", "تقارير المخازن", "عرض فقط"] },
    ];
    writeRoles(defaultRoles);
    return defaultRoles;
  }
  return roles;
}

export default function UserManagement({ onBack }: Props) {
  const { can } = usePermission();
  const canManage = can("المستخدمين");
  const [users, setUsers] = useState<AppUserType[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [showUserForm, setShowUserForm] = useState(false);
  const [showRoleForm, setShowRoleForm] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [userForm, setUserForm] = useState({ username: "", password: "", displayName: "", role: "مستخدم", active: true });
  const [roleForm, setRoleForm] = useState({ name: "", permissions: [] as string[] });

  useEffect(() => {
    seedDefaultData().then(setUsers);
    setRoles(seedDefaultRoles());
  }, []);

  function resetUserForm() {
    setUserForm({ username: "", password: "", displayName: "", role: "مستخدم", active: true });
    setEditingUserId(null);
    setShowUserForm(false);
  }

  function openEditUser(u: AppUserType) {
    setUserForm({ username: u.username, password: "", displayName: u.displayName, role: u.role, active: u.active });
    setEditingUserId(u.id);
    setShowUserForm(true);
  }

  async function handleSaveUser() {
    if (!userForm.username.trim() || !userForm.displayName.trim()) return;
    if (editingUserId) {
      const updated = users.map((u) => {
        if (u.id !== editingUserId) return u;
        return {
          ...u,
          username: userForm.username,
          displayName: userForm.displayName,
          role: userForm.role,
          active: userForm.active,
          password: userForm.password ? userForm.password : u.password,
        };
      });
      writeUsers(updated);
      setUsers(updated);
      logger.info("UserManagement: user updated", { id: editingUserId });
    } else {
      if (!userForm.password) return;
      const hashedPassword = await hashPassword(userForm.password);
      const user: AppUserType = {
        id: nextId(),
        username: userForm.username,
        password: hashedPassword,
        displayName: userForm.displayName,
        role: userForm.role,
        active: userForm.active,
        createdAt: new Date().toISOString(),
      };
      const updated = [...users, user];
      writeUsers(updated);
      setUsers(updated);
      logger.info("UserManagement: user created", { username: userForm.username });
    }
    resetUserForm();
  }

  function handleToggleUser(id: string) {
    const updated = users.map((u) => u.id === id ? { ...u, active: !u.active } : u);
    writeUsers(updated);
    setUsers(updated);
    logger.info("UserManagement: user toggled", { id, active: !users.find((u) => u.id === id)?.active });
  }

  function handleDeleteUser(id: string) {
    if (!confirm("تأكيد حذف هذا المستخدم؟")) return;
    const updated = users.filter((u) => u.id !== id);
    writeUsers(updated);
    setUsers(updated);
    logger.info("UserManagement: user deleted", { id });
  }

  function resetRoleForm() {
    setRoleForm({ name: "", permissions: [] });
    setEditingRoleId(null);
    setShowRoleForm(false);
  }

  function openEditRole(r: Role) {
    setRoleForm({ name: r.name, permissions: [...r.permissions] });
    setEditingRoleId(r.id);
    setShowRoleForm(true);
  }

  function handleSaveRole() {
    if (!roleForm.name.trim()) return;
    if (editingRoleId) {
      const updated = roles.map((r) => r.id === editingRoleId ? { ...r, ...roleForm } : r);
      writeRoles(updated);
      setRoles(updated);
      logger.info("UserManagement: role updated", { id: editingRoleId });
    } else {
      const role: Role = { id: nextId(), ...roleForm };
      const updated = [...roles, role];
      writeRoles(updated);
      setRoles(updated);
      logger.info("UserManagement: role created", { name: roleForm.name });
    }
    resetRoleForm();
  }

  function handleDeleteRole(id: string) {
    if (!confirm("تأكيد حذف هذه المجموعة؟")) return;
    const updated = roles.filter((r) => r.id !== id);
    writeRoles(updated);
    setRoles(updated);
    logger.info("UserManagement: role deleted", { id });
  }

  function togglePermission(perm: string) {
    setRoleForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(perm)
        ? prev.permissions.filter((p) => p !== perm)
        : [...prev.permissions, perm],
    }));
  }

  if (!canManage) {
    return (
      <div className="rounded-lg bg-card-bg p-6 text-white shadow-md">
        <div className="mb-4 flex items-center gap-3">
          <button onClick={onBack} className="flex items-center gap-1 text-sm text-slate-400 hover:text-white transition">
            <ArrowLeft className="h-4 w-4" /> رجوع
          </button>
          <h3 className="text-lg font-bold">إدارة المستخدمين والصلاحيات</h3>
        </div>
        <p className="text-sm text-red-400">ليس لديك صلاحية الوصول إلى هذه الصفحة</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-card-bg p-6 text-white shadow-md">
      <div className="mb-4 flex items-center gap-3">
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-slate-400 hover:text-white transition">
          <ArrowLeft className="h-4 w-4" /> رجوع
        </button>
        <h3 className="text-lg font-bold">إدارة المستخدمين والصلاحيات</h3>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4">
        <div className="rounded border border-sky-500/30 bg-sky-500/10 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-bold text-sky-400">المستخدمين</h4>
            <ProtectedSection permission="المستخدمين">
              <button onClick={() => { resetUserForm(); setShowUserForm(true); }}
                className="flex items-center gap-1 rounded bg-sky-600 px-2 py-1 text-xs text-white hover:bg-sky-700 transition">
                <Plus className="h-3 w-3" /> إضافة
              </button>
            </ProtectedSection>
          </div>
          <div className="space-y-2">
            {users.map((u) => (
              <div key={u.id} className="flex items-center justify-between rounded bg-white/5 px-3 py-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold">{u.displayName}</span>
                    <span className="rounded bg-sky-500/20 px-1.5 py-0.5 text-[10px] text-sky-400">{u.role}</span>
                    {u.active ? <UserCheck className="h-3 w-3 text-green-400" /> : <UserX className="h-3 w-3 text-red-400" />}
                  </div>
                  <div className="text-[11px] text-slate-500">{u.username}</div>
                </div>
                <div className="flex gap-1">
                  <ProtectedSection permission="المستخدمين"><button onClick={() => openEditUser(u)} className="text-sky-400 hover:text-sky-300" title="تعديل"><Pencil className="h-3.5 w-3.5" /></button></ProtectedSection>
                  <ProtectedSection permission="المستخدمين"><button onClick={() => handleToggleUser(u.id)} className="text-amber-400 hover:text-amber-300" title={u.active ? "إيقاف" : "تفعيل"}><Shield className="h-3.5 w-3.5" /></button></ProtectedSection>
                  <ProtectedSection permission="المستخدمين"><button onClick={() => handleDeleteUser(u.id)} className="text-red-400 hover:text-red-300" title="حذف"><Trash2 className="h-3.5 w-3.5" /></button></ProtectedSection>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded border border-teal-500/30 bg-teal-500/10 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-bold text-teal-400">مجموعات الصلاحيات</h4>
            <ProtectedSection permission="المستخدمين">
              <button onClick={() => { resetRoleForm(); setShowRoleForm(true); }}
                className="flex items-center gap-1 rounded bg-teal-600 px-2 py-1 text-xs text-white hover:bg-teal-700 transition">
                <Plus className="h-3 w-3" /> إضافة
              </button>
            </ProtectedSection>
          </div>
          <div className="space-y-2">
            {roles.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded bg-white/5 px-3 py-2">
                <span className="text-sm font-bold">{r.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500">{r.permissions.length} صلاحيات</span>
                  <ProtectedSection permission="المستخدمين"><button onClick={() => openEditRole(r)} className="text-sky-400 hover:text-sky-300"><Pencil className="h-3.5 w-3.5" /></button></ProtectedSection>
                  <ProtectedSection permission="المستخدمين"><button onClick={() => handleDeleteRole(r.id)} className="text-red-400 hover:text-red-300"><Trash2 className="h-3.5 w-3.5" /></button></ProtectedSection>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showUserForm && (
        <div className="mb-4 rounded border border-sky-500/30 bg-sky-500/10 p-4">
          <h4 className="mb-3 text-sm font-bold text-sky-400">{editingUserId ? "تعديل مستخدم" : "إضافة مستخدم جديد"}</h4>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <input placeholder="اسم المستخدم *" value={userForm.username} onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
              className="rounded border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white outline-none focus:border-sky-500 placeholder:text-slate-500" />
            <input placeholder={editingUserId ? "اتركه فارغاً بدون تغيير" : "كلمة المرور *"} type="password" value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
              className="rounded border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white outline-none focus:border-sky-500 placeholder:text-slate-500" />
            <input placeholder="الاسم المعروض *" value={userForm.displayName} onChange={(e) => setUserForm({ ...userForm, displayName: e.target.value })}
              className="rounded border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white outline-none focus:border-sky-500 placeholder:text-slate-500" />
            <select value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
              className="rounded border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white outline-none focus:border-sky-500">
              {roles.map((r) => <option key={r.id} value={r.name}>{r.name}</option>)}
            </select>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input type="checkbox" checked={userForm.active} onChange={(e) => setUserForm({ ...userForm, active: e.target.checked })} className="rounded" />
              مفعل
            </label>
          </div>
          <div className="mt-3 flex gap-2">
            <button onClick={handleSaveUser} className="flex items-center gap-1 rounded bg-sky-600 px-3 py-1.5 text-sm text-white hover:bg-sky-700 transition">
              <Save className="h-4 w-4" /> حفظ
            </button>
            <button onClick={resetUserForm} className="flex items-center gap-1 rounded bg-white/10 px-3 py-1.5 text-sm text-slate-400 hover:bg-white/20 transition">
              <X className="h-4 w-4" /> إلغاء
            </button>
          </div>
        </div>
      )}

      {showRoleForm && (
        <div className="rounded border border-teal-500/30 bg-teal-500/10 p-4">
          <h4 className="mb-3 text-sm font-bold text-teal-400">{editingRoleId ? "تعديل مجموعة صلاحيات" : "إضافة مجموعة صلاحيات جديدة"}</h4>
          <input placeholder="اسم المجموعة *" value={roleForm.name} onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
            className="mb-3 w-full rounded border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white outline-none focus:border-teal-500 placeholder:text-slate-500" />
          <div className="mb-3 grid grid-cols-3 gap-2 lg:grid-cols-5">
            {allPermissions.map((perm) => (
              <label key={perm} className="flex items-center gap-1.5 rounded bg-white/5 px-2 py-1 text-xs text-slate-300 cursor-pointer hover:bg-white/10">
                <input type="checkbox" checked={roleForm.permissions.includes(perm)} onChange={() => togglePermission(perm)} className="rounded" />
                {perm}
              </label>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={handleSaveRole} className="flex items-center gap-1 rounded bg-teal-600 px-3 py-1.5 text-sm text-white hover:bg-teal-700 transition">
              <Save className="h-4 w-4" /> حفظ
            </button>
            <button onClick={resetRoleForm} className="flex items-center gap-1 rounded bg-white/10 px-3 py-1.5 text-sm text-slate-400 hover:bg-white/20 transition">
              <X className="h-4 w-4" /> إلغاء
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
