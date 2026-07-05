import { logger } from "@/lib/logger";
import { hashPassword } from "@/lib/crypto";
import type { Employee, AttendanceRecord, AttendanceStatus, RecordMethod } from "./attendanceTypes";

/* ── WebAuthn helpers ── */

function ab2b64(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

function b642ab(b64: string): ArrayBuffer {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)).buffer;
}

function randomChallenge(): Uint8Array {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return arr;
}

function isWebAuthnAvailable(): boolean {
  return typeof window !== "undefined" && !!navigator?.credentials?.create;
}

const KEYS = {
  employees: "jarash_attendance_employees",
  records: "jarash_attendance_records",
} as const;

function read<T>(key: string, fallback: T): T {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch { return fallback; }
}

function write<T>(key: string, data: T): void {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch { logger.error("attendanceService: write failed", { key }); }
}

let idCounter = Date.now();
function nextId(prefix: string): string { return `${prefix}_${++idCounter}`; }

function parseTime(str: string): number {
  const [h, m] = (str || "08:00").split(":").map(Number);
  return h * 60 + (m || 0);
}

function currentMinutes(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

/** حساب حالة الحضور بناءً على موعد بدء العمل */
function calcStatus(employee: Employee): AttendanceStatus {
  if (!employee.workStart) return "present";
  const startMin = parseTime(employee.workStart);
  const graceMin = 15; // 15 دقيقة سماح
  const nowMin = currentMinutes();
  if (nowMin > startMin + graceMin) return "late";
  return "present";
}

async function computeHash(record: {
  previousHash: string;
  employeeId: string;
  employeeName: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: string;
  notes: string;
}): Promise<string> {
  const data = [
    record.previousHash, record.employeeId, record.employeeName,
    record.date, record.checkIn ?? "", record.checkOut ?? "",
    record.status, record.notes,
  ].join("|");
  return hashPassword(data);
}

/* ── Employees ── */

export const employeeService = {
  getAll(): Employee[] {
    return read<Employee[]>(KEYS.employees, []);
  },

  getById(id: string): Employee | null {
    return this.getAll().find((e) => e.id === id) ?? null;
  },

  getByCode(code: string): Employee | null {
    return this.getAll().find((e) => e.code === code && e.isActive) ?? null;
  },

  async create(data: { code: string; name: string; department: string; pin?: string; workStart?: string; workEnd?: string }): Promise<Employee> {
    const items = this.getAll();
    if (items.some((e) => e.code === data.code)) throw new Error(`رقم الموظف ${data.code} موجود مسبقاً`);
    const hashedPin = data.pin ? await hashPassword(data.pin) : "";
    const employee: Employee = {
      id: nextId("emp"),
      code: data.code,
      name: data.name,
      department: data.department,
      pin: hashedPin,
      isActive: true,
      createdAt: new Date().toISOString(),
      credentialId: null,
      credentialPublicKey: null,
      credentialAlgorithm: null,
      workStart: data.workStart || "08:00",
      workEnd: data.workEnd || "16:00",
      zkUid: undefined,
      zkEnrolled: false,
    };
    items.push(employee);
    write(KEYS.employees, items);
    logger.info("attendance: employee created", { id: employee.id, code: employee.code, name: employee.name });
    return employee;
  },

  async update(id: string, data: Partial<Omit<Employee, "id" | "createdAt">>): Promise<Employee | null> {
    const items = this.getAll();
    const idx = items.findIndex((e) => e.id === id);
    if (idx === -1) { logger.warn("attendance: employee not found", { id }); return null; }
    if (data.code && data.code !== items[idx].code && items.some((e) => e.code === data.code)) {
      throw new Error(`رقم الموظف ${data.code} موجود مسبقاً`);
    }
    const updateData = { ...data };
    if (data.pin) updateData.pin = await hashPassword(data.pin);
    items[idx] = { ...items[idx], ...updateData };
    write(KEYS.employees, items);
    logger.info("attendance: employee updated", { id });
    return items[idx];
  },

  delete(id: string): boolean {
    const items = this.getAll();
    const filtered = items.filter((e) => e.id !== id);
    if (filtered.length === items.length) { logger.warn("attendance: employee not found for delete", { id }); return false; }
    write(KEYS.employees, filtered);
    logger.info("attendance: employee deleted", { id });
    return true;
  },

  /* ── WebAuthn (بصمة الجوال/الكمبيوتر) ── */

  hasBiometric(employeeId: string): boolean {
    const emp = this.getById(employeeId);
    return !!emp?.credentialId;
  },

  async registerBiometric(employeeId: string): Promise<void> {
    const emp = this.getById(employeeId);
    if (!emp) throw new Error("الموظف غير موجود");
    if (!isWebAuthnAvailable()) throw new Error("المتصفح لا يدعم البصمة — استخدم HTTPS أو متصفح حديث");

    const challenge = randomChallenge();
    const userId = new TextEncoder().encode(emp.id);

    const pubKeyCredential = await navigator.credentials.create({
      publicKey: {
        rp: { id: window.location.hostname, name: "Jarash Hotel" },
        user: {
          id: userId,
          name: emp.code,
          displayName: emp.name,
        },
        challenge,
        pubKeyCredParams: [{ type: "public-key", alg: -7 }],
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          userVerification: "required",
          residentKey: "preferred",
        },
        timeout: 60000,
      },
    }) as PublicKeyCredential | null;

    if (!pubKeyCredential) throw new Error("لم يتم تسجيل البصمة");

    const response = pubKeyCredential.response as AuthenticatorAttestationResponse;
    const credentialId = ab2b64(pubKeyCredential.rawId);
    const publicKey = response.getPublicKey()
      ? ab2b64(response.getPublicKey()!)
      : "";
    const algorithm = response.getPublicKeyAlgorithm();

    await employeeService.update(emp.id, {
      credentialId,
      credentialPublicKey: publicKey,
      credentialAlgorithm: algorithm,
    });

    logger.info("attendance: biometric registered", { employeeId: emp.id, name: emp.name });
  },

  async verifyBiometric(employeeId: string): Promise<boolean> {
    const emp = this.getById(employeeId);
    if (!emp) throw new Error("الموظف غير موجود");
    if (!emp.credentialId) throw new Error("لا توجد بصمة مسجلة");
    if (!isWebAuthnAvailable()) throw new Error("المتصفح لا يدعم البصمة");

    const challenge = randomChallenge();
    const credentialId = b642ab(emp.credentialId);

    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge,
        allowCredentials: [{ id: credentialId, type: "public-key" }],
        userVerification: "required",
        timeout: 60000,
      },
    }) as PublicKeyCredential | null;

    if (!assertion) return false;
    return true;
  },

  async removeBiometric(employeeId: string): Promise<void> {
    await employeeService.update(employeeId, {
      credentialId: null,
      credentialPublicKey: null,
      credentialAlgorithm: null,
    });
    logger.info("attendance: biometric removed", { employeeId });
  },

  getNextUid(): number {
    const employees = this.getAll();
    if (employees.length === 0) return 1;
    const maxUid = Math.max(...employees.map((e) => e.zkUid || 0));
    return Math.min(maxUid + 1, 3000);
  },
};

/* ── Attendance Records ── */

const DUPLICATE_COOLDOWN_MINUTES = 1; // دقيقة واحدة لمنع التكرار

export const attendanceRecordService = {
  getAll(): AttendanceRecord[] {
    return read<AttendanceRecord[]>(KEYS.records, []);
  },

  getById(id: string): AttendanceRecord | null {
    return this.getAll().find((r) => r.id === id) ?? null;
  },

  getByDate(date: string): AttendanceRecord[] {
    return this.getAll().filter((r) => r.date === date);
  },

  getByEmployee(employeeId: string): AttendanceRecord[] {
    return this.getAll().filter((r) => r.employeeId === employeeId);
  },

  getByDateRange(from: string, to: string): AttendanceRecord[] {
    return this.getAll().filter((r) => r.date >= from && r.date <= to);
  },

  getTodayForEmployee(employeeId: string): AttendanceRecord | null {
    const today = new Date().toISOString().split("T")[0];
    return this.getAll().find((r) => r.employeeId === employeeId && r.date === today) ?? null;
  },

  /** هل آخر بصمة للموظف مكررة (خلال دقيقة)؟ */
  isDuplicate(employeeId: string): boolean {
    const all = this.getAll();
    const now = Date.now();
    const recent = all.filter((r) => r.employeeId === employeeId);
    if (recent.length === 0) return false;
    const last = recent[recent.length - 1];
    const lastTime = new Date(last.checkIn || last.createdAt).getTime();
    return (now - lastTime) < DUPLICATE_COOLDOWN_MINUTES * 60 * 1000;
  },

  /** تسجيل دخول من جهاز ZKTeco (تلقائي) */
  async recordFromZk(employeeId: string, employeeName: string, employeeCode: string, timestamp: string): Promise<AttendanceRecord> {
    const employee = employeeService.getById(employeeId);
    if (!employee) throw new Error("الموظف غير موجود");

    // منع التكرار
    if (this.isDuplicate(employeeId)) {
      throw new Error("مكرر");
    }

    const today = timestamp.split("T")[0];
    const existing = this.getTodayForEmployee(employeeId);

    if (!existing || !existing.checkIn) {
      // تسجيل دخول
      return this.checkIn(employeeId, "zk-fingerprint", timestamp);
    } else if (existing && existing.checkIn && !existing.checkOut) {
      // تسجيل خروج
      return this.checkOut(employeeId, "zk-fingerprint", timestamp);
    } else {
      // دخول وخروج موجود — بصمة إضافية (نتجاوزها)
      throw new Error("مكتمل");
    }
  },

  async checkIn(employeeId: string, method: RecordMethod, forcedTime?: string): Promise<AttendanceRecord> {
    const employees = employeeService.getAll();
    const employee = employees.find((e) => e.id === employeeId);
    if (!employee) throw new Error("الموظف غير موجود");
    const today = new Date().toISOString().split("T")[0];
    const existing = this.getTodayForEmployee(employeeId);
    if (existing && existing.checkIn) throw new Error("تم تسجيل الدخول مسبقاً اليوم");
    const now = forcedTime || new Date().toISOString();
    const allRecords = this.getAll();
    const lastRecord = allRecords.length > 0 ? allRecords[allRecords.length - 1] : null;
    const previousHash = lastRecord ? lastRecord.hash : "0";
    const status = calcStatus(employee);
    const record: AttendanceRecord = {
      id: nextId("att"),
      employeeId,
      employeeName: employee.name,
      employeeCode: employee.code,
      date: today,
      checkIn: now,
      checkOut: null,
      status,
      method,
      notes: "",
      createdAt: now,
      hash: "",
      previousHash,
    };
    record.hash = await computeHash(record);
    allRecords.push(record);
    write(KEYS.records, allRecords);
    logger.info("attendance: check-in", { employeeId, name: employee.name, status });
    return record;
  },

  async checkOut(employeeId: string, method: RecordMethod, forcedTime?: string): Promise<AttendanceRecord | null> {
    const today = new Date().toISOString().split("T")[0];
    const allRecords = this.getAll();
    const idx = allRecords.findIndex((r) => r.employeeId === employeeId && r.date === today && r.checkIn && !r.checkOut);
    if (idx === -1) throw new Error("لا يوجد تسجيل دخول اليوم للخروج");
    const now = forcedTime || new Date().toISOString();
    allRecords[idx] = { ...allRecords[idx], checkOut: now, method };
    const lastRecord = idx > 0 ? allRecords[idx - 1] : null;
    allRecords[idx].previousHash = lastRecord ? lastRecord.hash : "0";
    allRecords[idx].hash = await computeHash(allRecords[idx]);
    write(KEYS.records, allRecords);
    logger.info("attendance: check-out", { employeeId });
    return allRecords[idx];
  },

  async verifyChain(): Promise<{ valid: boolean; brokenAt: string | null }> {
    const records = this.getAll();
    if (records.length === 0) return { valid: true, brokenAt: null };
    let prevHash = "0";
    for (const record of records) {
      if (record.previousHash !== prevHash) return { valid: false, brokenAt: record.id };
      const temp = { ...record, hash: "" };
      const expectedHash = await computeHash(temp);
      if (record.hash !== expectedHash) return { valid: false, brokenAt: record.id };
      prevHash = record.hash;
    }
    return { valid: true, brokenAt: null };
  },

  async fixChain(): Promise<void> {
    const records = this.getAll();
    if (records.length === 0) return;
    let prevHash = "0";
    for (let i = 0; i < records.length; i++) {
      const temp = { ...records[i], hash: "", previousHash: prevHash };
      const hash = await computeHash(temp);
      records[i] = { ...temp, hash };
      prevHash = hash;
    }
    write(KEYS.records, records);
    logger.info("attendance: chain fixed", { count: records.length });
  },
};
