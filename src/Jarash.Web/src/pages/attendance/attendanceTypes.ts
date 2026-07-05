export interface Employee {
  id: string;
  code: string;
  name: string;
  department: string;
  pin: string;
  isActive: boolean;
  createdAt: string;
  credentialId: string | null;
  credentialPublicKey: string | null;
  credentialAlgorithm: number | null;
  /** موعد بدء العمل (ساعة:دقيقة، مثال: "08:00") */
  workStart?: string;
  /** موعد نهاية العمل (ساعة:دقيقة، مثال: "16:00") */
  workEnd?: string;
  /** UID في جهاز ZKTeco */
  zkUid?: number;
  /** هل تم تسجيل بصمته على الجهاز؟ */
  zkEnrolled?: boolean;
}

export type AttendanceStatus = "present" | "absent" | "late" | "half-day";

export type RecordMethod = "fingerprint" | "pin" | "manual" | "zk-fingerprint";

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: AttendanceStatus;
  method: RecordMethod;
  notes: string;
  createdAt: string;
  hash: string;
  previousHash: string;
}

export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
  present: "حاضر",
  absent: "غائب",
  late: "متأخر",
  "half-day": "نصف يوم",
};

export const ATTENDANCE_STATUS_COLORS: Record<AttendanceStatus, string> = {
  present: "text-green-500 bg-green-500/10 border-green-500/20",
  absent: "text-red-500 bg-red-500/10 border-red-500/20",
  late: "text-amber-500 bg-amber-500/10 border-amber-500/20",
  "half-day": "text-yellow-500 bg-yellow-500/10 border-yellow-500/20",
};

export const DEPARTMENTS = ["إدارة", "استقبال", "خدمة غرف", "مطعم", "مطبخ", "صيانة", "حراسة", "تدبير", "محاسبة"] as const;
