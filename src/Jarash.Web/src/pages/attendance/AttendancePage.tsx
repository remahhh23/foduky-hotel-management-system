import { useState, useEffect, useCallback, useRef } from "react";
import {
  Fingerprint,
  Users,
  ClipboardList,
  FileSpreadsheet,
  Plus,
  Pencil,
  Trash2,
  ShieldCheck,
  X,
  Download,
  AlertTriangle,
  Monitor,
  Wifi,
  WifiOff,
  RefreshCw,
  Server,
  Clock,
  Calendar,
  CheckCircle2,
  XCircle,
  List,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";
import { Button } from "@/components/ui/button";
import { downloadCSV } from "@/lib/csv";
import { employeeService, attendanceRecordService } from "./attendanceService";
import {
  ATTENDANCE_STATUS_LABELS,
  ATTENDANCE_STATUS_COLORS,
  DEPARTMENTS,
} from "./attendanceTypes";
import type { Employee, AttendanceRecord, AttendanceStatus } from "./attendanceTypes";
import { zkBridgeService } from "@/lib/zkBridgeService";

type PageView = "checkin" | "log" | "report" | "employees" | "device";

interface TabDef {
  id: PageView;
  label: string;
  icon: React.ElementType;
}

const TABS: TabDef[] = [
  { id: "checkin", label: "تسجيل الحضور", icon: Fingerprint },
  { id: "log", label: "سجل الحضور", icon: ClipboardList },
  { id: "report", label: "التقارير", icon: FileSpreadsheet },
  { id: "employees", label: "الموظفين", icon: Users },
  { id: "device", label: "جهاز البصمة", icon: Monitor },
];

function getTime(iso: string | null): string {
  if (!iso) return "--";
  return new Date(iso).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" });
}

function getDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("ar-SA", { weekday: "short", year: "numeric", month: "short", day: "numeric" });
}

export default function AttendancePage() {
  const [view, setView] = useState<PageView>("checkin");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [selectedEmpId, setSelectedEmpId] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [chainStatus, setChainStatus] = useState<{ valid: boolean; checking: boolean }>({ valid: true, checking: false });

  /* ZK Device */
  const [zkIp, setZkIp] = useState(localStorage.getItem("jarash_zk_ip") || "");
  const [zkConnected, setZkConnected] = useState(false);
  const [zkSyncing, setZkSyncing] = useState(false);
  const [zkInfo, setZkInfo] = useState<string | null>(null);

  /* ZK real-time monitoring */
  const [realtimeLog, setRealtimeLog] = useState<{ userId: string; timestamp: string; employeeName: string }[]>([]);
  const [realtimeActive, setRealtimeActive] = useState(false);
  const realtimeRef = useRef(false);

  /* Filters */
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [filterEmpId, setFilterEmpId] = useState("");

  /* Report */
  const [reportFrom, setReportFrom] = useState("");
  const [reportTo, setReportTo] = useState("");

  /* Employee form */
  const [showEmpForm, setShowEmpForm] = useState(false);
  const [editEmpId, setEditEmpId] = useState<string | null>(null);
  const [empForm, setEmpForm] = useState({ code: "", name: "", department: "", workStart: "08:00", workEnd: "16:00" });
  const [empFormError, setEmpFormError] = useState("");

  const loadData = useCallback(() => {
    setEmployees(employeeService.getAll());
    setRecords(attendanceRecordService.getAll());
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (selectedEmpId) {
      setTodayRecord(attendanceRecordService.getTodayForEmployee(selectedEmpId));
    } else {
      setTodayRecord(null);
    }
  }, [selectedEmpId, records]);

  function showMsg(type: "success" | "error", text: string) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  }

  /* ── Verify Chain ── */
  async function handleVerifyChain() {
    setChainStatus((s) => ({ ...s, checking: true }));
    const result = await attendanceRecordService.verifyChain();
    setChainStatus({ valid: result.valid, checking: false });
    if (result.valid) {
      showMsg("success", "سلسلة التوثيق سليمة — لم يتم العبث بالسجلات");
    } else {
      showMsg("error", `تم اكتشاف خلل في السلسلة! السجل المخترق: ${result.brokenAt?.slice(-8)}`);
    }
  }

  async function handleFixChain() {
    await attendanceRecordService.fixChain();
    loadData();
    setChainStatus({ valid: true, checking: false });
    showMsg("success", "تم إصلاح سلسلة التوثيق");
  }

  /* ── WebAuthn — بصمة الجوال ── */
  async function handleWebAuthnCheckIn(empId: string) {
    setSaving(true);
    try {
      const ok = await employeeService.verifyBiometric(empId);
      if (!ok) { showMsg("error", "فشل التحقق بالبصمة"); setSaving(false); return; }
      const r = await attendanceRecordService.checkIn(empId, "fingerprint");
      showMsg("success", `تم تسجيل دخول ${r.employeeName} الساعة ${getTime(r.checkIn)}`);
      loadData();
    } catch (err: any) {
      showMsg("error", err?.message || "فشلت العملية");
    } finally {
      setSaving(false);
    }
  }

  async function handleWebAuthnCheckOut(empId: string) {
    setSaving(true);
    try {
      const ok = await employeeService.verifyBiometric(empId);
      if (!ok) { showMsg("error", "فشل التحقق بالبصمة"); setSaving(false); return; }
      const r = await attendanceRecordService.checkOut(empId, "fingerprint");
      if (r) showMsg("success", `تم تسجيل خروج ${r.employeeName} الساعة ${getTime(r.checkOut)}`);
      loadData();
    } catch (err: any) {
      showMsg("error", err?.message || "فشلت العملية");
    } finally {
      setSaving(false);
    }
  }

  /* ── Filtered Records ── */
  function getFilteredRecords(): AttendanceRecord[] {
    let result = records;
    if (filterDateFrom) result = result.filter((r) => r.date >= filterDateFrom);
    if (filterDateTo) result = result.filter((r) => r.date <= filterDateTo);
    if (filterEmpId) result = result.filter((r) => r.employeeId === filterEmpId);
    return result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  /* ── Report ── */
  function getReportRecords(): AttendanceRecord[] {
    if (!reportFrom || !reportTo) return [];
    return records
      .filter((r) => r.date >= reportFrom && r.date <= reportTo)
      .sort((a, b) => a.date.localeCompare(b.date) || a.employeeCode.localeCompare(b.employeeCode));
  }

  function getReportSummary() {
    const data = getReportRecords();
    const totalDays = new Set(data.map((r) => r.date)).size;
    const present = data.filter((r) => r.status === "present").length;
    const absent = data.filter((r) => r.status === "absent").length;
    const late = data.filter((r) => r.status === "late").length;
    const halfDay = data.filter((r) => r.status === "half-day").length;
    return { totalRecords: data.length, totalDays, present, absent, late, halfDay };
  }

  function exportReport() {
    const data = getReportRecords();
    if (data.length === 0) { showMsg("error", "لا توجد بيانات للتصدير"); return; }
    const headers = ["التاريخ", "كود الموظف", "اسم الموظف", "دخول", "خروج", "الحالة", "طريقة التسجيل"];
    const rows = data.map((r) => [
      getDate(r.date),
      r.employeeCode,
      r.employeeName,
      getTime(r.checkIn),
      getTime(r.checkOut),
      ATTENDANCE_STATUS_LABELS[r.status],
      r.method === "zk-fingerprint" || r.method === "fingerprint" ? "بصمة" : "يدوي",
    ]);
    downloadCSV(headers, rows, `تقرير_الحضور_${reportFrom}_${reportTo}`);
    showMsg("success", "تم تصدير التقرير بنجاح");
  }

  /* ── Employee CRUD ── */
  function openNewEmployee() {
    setEditEmpId(null);
    setEmpForm({ code: "", name: "", department: DEPARTMENTS[0], workStart: "08:00", workEnd: "16:00" });
    setEmpFormError("");
    setShowEmpForm(true);
  }

  function openEditEmployee(emp: Employee) {
    setEditEmpId(emp.id);
    setEmpForm({ code: emp.code, name: emp.name, department: emp.department, workStart: emp.workStart || "08:00", workEnd: emp.workEnd || "16:00" });
    setEmpFormError("");
    setShowEmpForm(true);
  }

  async function saveEmployee() {
    setEmpFormError("");
    if (!empForm.code.trim() || !empForm.name.trim()) { setEmpFormError("الرجاء تعبئة جميع الحقول المطلوبة"); return; }
    setSaving(true);
    try {
      if (editEmpId) {
        await employeeService.update(editEmpId, {
          code: empForm.code.trim(),
          name: empForm.name.trim(),
          department: empForm.department,
          workStart: empForm.workStart,
          workEnd: empForm.workEnd,
        });
        showMsg("success", "تم تحديث بيانات الموظف");
      } else {
        await employeeService.create({
          code: empForm.code.trim(),
          name: empForm.name.trim(),
          department: empForm.department,
          workStart: empForm.workStart,
          workEnd: empForm.workEnd,
        });
        showMsg("success", "تم إضافة الموظف الجديد");
      }
      setShowEmpForm(false);
      loadData();
    } catch (err: any) {
      setEmpFormError(err?.message || "فشلت العملية");
    } finally {
      setSaving(false);
    }
  }

  function deleteEmployee(id: string, name: string) {
    if (!confirm(`هل أنت متأكد من حذف الموظف "${name}"؟`)) return;
    employeeService.delete(id);
    loadData();
    showMsg("success", `تم حذف ${name}`);
  }

  function toggleEmployeeStatus(id: string, current: boolean) {
    employeeService.update(id, { isActive: !current });
    loadData();
  }

  /* ── Render: Check-in view ── */
  function renderCheckIn() {
    const activeEmps = employees.filter((e) => e.isActive);
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <div className="flex items-center justify-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-sky-500/20 text-sky-400">
            <Fingerprint className="h-12 w-12" />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-400">اختر الموظف</label>
          <select value={selectedEmpId} onChange={(e) => setSelectedEmpId(e.target.value)}
            className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm outline-none focus:border-sky-500">
            <option value="">-- اختر الموظف --</option>
            {activeEmps.map((e) => (
              <option key={e.id} value={e.id}>{e.code} — {e.name}</option>
            ))}
          </select>
        </div>

        {selectedEmpId && !todayRecord?.checkIn && (
          <div className="space-y-3">
            {employeeService.hasBiometric(selectedEmpId) && (
              <Button onClick={() => handleWebAuthnCheckIn(selectedEmpId)} disabled={saving}
                className="w-full gap-2 py-6 text-lg">
                <Fingerprint className="h-6 w-6" /> بصمة الجوال — تسجيل دخول
              </Button>
            )}
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-center">
              <p className="text-xs text-amber-300">أو استخدم جهاز البصمة الخارجي (ZKTeco)</p>
              <p className="mt-1 text-xs text-slate-500">اذهب إلى تبويب "جهاز البصمة" وشغّل المراقبة الحية</p>
            </div>
          </div>
        )}

        {selectedEmpId && todayRecord?.checkIn && !todayRecord.checkOut && (
          <div className="space-y-3">
            {employeeService.hasBiometric(selectedEmpId) && (
              <Button onClick={() => handleWebAuthnCheckOut(selectedEmpId)} disabled={saving}
                className="w-full gap-2 py-6 text-lg">
                <Fingerprint className="h-6 w-6" /> بصمة الجوال — تسجيل خروج
              </Button>
            )}
            <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-4 text-center">
              <p className="text-xs text-sky-300">أو استخدم جهاز البصمة الخارجي (ZKTeco)</p>
              <p className="mt-1 text-xs text-slate-500">ضع إصبعك على جهاز البصمة لتسجيل الانصراف</p>
            </div>
          </div>
        )}

        {todayRecord && (
          <div className="rounded-xl border border-white/10 bg-card-bg p-5">
            <h4 className="mb-3 text-sm font-bold text-white">حضور اليوم</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">الحالة</span>
                <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", ATTENDANCE_STATUS_COLORS[todayRecord.status])}>
                  {ATTENDANCE_STATUS_LABELS[todayRecord.status]}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">وقت الدخول</span>
                <span className="text-white font-mono">{getTime(todayRecord.checkIn)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">وقت الخروج</span>
                <span className="text-white font-mono">{getTime(todayRecord.checkOut)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">طريقة التسجيل</span>
                <span className="text-white">بصمة</span>
              </div>
            </div>
          </div>
        )}

        {!selectedEmpId && (
          <div className="rounded-xl border border-white/10 p-8 text-center">
            <p className="text-sm text-slate-400">اختر موظفاً لتسجيل الحضور أو الانصراف</p>
          </div>
        )}
      </div>
    );
  }

  /* ── Render: Log view ── */
  function renderLog() {
    const filtered = getFilteredRecords();
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs text-slate-400">من تاريخ</label>
            <input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)}
              className="rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 text-sm outline-none focus:border-sky-500" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">إلى تاريخ</label>
            <input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)}
              className="rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 text-sm outline-none focus:border-sky-500" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">الموظف</label>
            <select value={filterEmpId} onChange={(e) => setFilterEmpId(e.target.value)}
              className="rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 text-sm outline-none focus:border-sky-500">
              <option value="">الكل</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          </div>
          <button onClick={handleVerifyChain} disabled={chainStatus.checking}
            className="flex items-center gap-1 rounded-lg border border-white/20 px-3 py-1.5 text-xs text-slate-400 hover:text-white transition-colors">
            <ShieldCheck className="h-3.5 w-3.5" />
            {chainStatus.checking ? "جاري التحقق..." : "تحقق من سلامة السجلات"}
          </button>
          {!chainStatus.valid && (
            <button onClick={handleFixChain}
              className="flex items-center gap-1 rounded-lg border border-amber-500/30 px-3 py-1.5 text-xs text-amber-400 hover:text-amber-300 transition-colors">
              <AlertTriangle className="h-3.5 w-3.5" /> إصلاح السلسلة
            </button>
          )}
        </div>

        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="p-3 text-right text-xs font-medium text-slate-400">التاريخ</th>
                <th className="p-3 text-right text-xs font-medium text-slate-400">الكود</th>
                <th className="p-3 text-right text-xs font-medium text-slate-400">الموظف</th>
                <th className="p-3 text-right text-xs font-medium text-slate-400">دخول</th>
                <th className="p-3 text-right text-xs font-medium text-slate-400">خروج</th>
                <th className="p-3 text-right text-xs font-medium text-slate-400">الحالة</th>
                <th className="p-3 text-right text-xs font-medium text-slate-400">الطريقة</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="p-8 text-center text-sm text-slate-500">لا توجد سجلات</td></tr>
              )}
              {filtered.map((r) => (
                <tr key={r.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="p-3 text-white">{getDate(r.date)}</td>
                  <td className="p-3 text-slate-400 font-mono text-xs">{r.employeeCode}</td>
                  <td className="p-3 text-white">{r.employeeName}</td>
                  <td className="p-3 text-white font-mono text-xs">{getTime(r.checkIn)}</td>
                  <td className="p-3 text-white font-mono text-xs">{getTime(r.checkOut)}</td>
                  <td className="p-3">
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", ATTENDANCE_STATUS_COLORS[r.status])}>
                      {ATTENDANCE_STATUS_LABELS[r.status]}
                    </span>
                  </td>
                  <td className="p-3 text-slate-400 text-xs">{r.method === "zk-fingerprint" || r.method === "fingerprint" ? "بصمة" : "يدوي"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  /* ── Render: Report view ── */
  function renderReport() {
    const reportData = getReportRecords();
    const summary = getReportSummary();

    // تقرير حسب الموظف — ملخص لكل موظف
    function getEmployeeReport() {
      const data = getReportRecords();
      const empMap = new Map<string, { present: number; late: number; absent: number; total: number }>();
      for (const r of data) {
        const existing = empMap.get(r.employeeId) || { present: 0, late: 0, absent: 0, total: 0 };
        existing.total++;
        if (r.status === "present") existing.present++;
        else if (r.status === "late") existing.late++;
        else if (r.status === "absent") existing.absent++;
        empMap.set(r.employeeId, existing);
      }
      return Array.from(empMap.entries()).map(([empId, stats]) => {
        const emp = employees.find((e) => e.id === empId);
        return { ...stats, empId, empName: emp?.name || empId, empCode: emp?.code || "", department: emp?.department || "" };
      }).sort((a, b) => a.empName.localeCompare(b.empName));
    }

    const empReport = getEmployeeReport();

    return (
      <div className="space-y-6">
        {/* اختيار التاريخ */}
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs text-slate-400">من تاريخ</label>
            <input type="date" value={reportFrom} onChange={(e) => setReportFrom(e.target.value)}
              className="rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 text-sm outline-none focus:border-sky-500" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">إلى تاريخ</label>
            <input type="date" value={reportTo} onChange={(e) => setReportTo(e.target.value)}
              className="rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 text-sm outline-none focus:border-sky-500" />
          </div>
          <Button onClick={exportReport} disabled={reportData.length === 0} className="gap-2">
            <Download className="h-4 w-4" /> تصدير إكسل
          </Button>
          {reportData.length > 0 && (
            <button onClick={handleVerifyChain} disabled={chainStatus.checking}
              className="flex items-center gap-1.5 rounded-lg border border-white/20 px-3 py-1.5 text-xs text-slate-400 hover:text-white transition-colors">
              <ShieldCheck className="h-3.5 w-3.5" />
              {chainStatus.checking ? "...جاري" : "سلامة السجلات"}
            </button>
          )}
        </div>

        {reportData.length > 0 && (
          <>
            {/* بطاقات الملخص */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { label: "إجمالي التسجيلات", value: summary.totalRecords, color: "text-white", icon: ClipboardList },
                { label: "أيام العمل", value: summary.totalDays, color: "text-sky-400", icon: Calendar },
                { label: "حضور في الموعد", value: summary.present, color: "text-green-400", icon: CheckCircle2 },
                { label: "متأخر", value: summary.late, color: "text-amber-400", icon: Clock },
                { label: "غياب", value: summary.absent, color: "text-red-400", icon: XCircle },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-white/10 bg-card-bg p-4 text-center">
                  <s.icon className={cn("h-5 w-5 mx-auto mb-1", s.color)} />
                  <p className={cn("text-xl font-bold", s.color)}>{s.value}</p>
                  <p className="mt-0.5 text-xs text-slate-400">{s.label}</p>
                </div>
              ))}
            </div>

            {/* ملخص الموظفين — مين متأخر ومين لا */}
            <div className="rounded-xl border border-white/10 bg-card-bg p-5">
              <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-white">
                <Users className="h-4 w-4 text-sky-400" /> ملخص الموظفين
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="p-2 text-right text-xs font-medium text-slate-400">الموظف</th>
                      <th className="p-2 text-right text-xs font-medium text-slate-400">القسم</th>
                      <th className="p-2 text-center text-xs font-medium text-slate-400">بدء العمل</th>
                      <th className="p-2 text-center text-xs font-medium text-slate-400">حضور</th>
                      <th className="p-2 text-center text-xs font-medium text-green-400">✅</th>
                      <th className="p-2 text-center text-xs font-medium text-amber-400">⏰ تأخير</th>
                      <th className="p-2 text-center text-xs font-medium text-red-400">❌ غياب</th>
                      <th className="p-2 text-center text-xs font-medium text-slate-400">نسبة الحضور</th>
                    </tr>
                  </thead>
                  <tbody>
                    {empReport.map((emp) => {
                      const attendPct = emp.total > 0 ? Math.round((emp.present / emp.total) * 100) : 0;
                      return (
                        <tr key={emp.empId} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="p-2 text-white">
                            <span className="font-mono text-xs text-slate-500 ml-2">{emp.empCode}</span>
                            {emp.empName}
                          </td>
                          <td className="p-2 text-slate-400 text-xs">{emp.department || "--"}</td>
                          <td className="p-2 text-center font-mono text-xs text-slate-400">
                            {employees.find((e) => e.id === emp.empId)?.workStart || "08:00"}
                          </td>
                          <td className="p-2 text-center text-xs text-slate-400">{emp.total} يوم</td>
                          <td className="p-2 text-center text-xs text-green-400 font-medium">{emp.present}</td>
                          <td className="p-2 text-center">
                            <span className={cn("text-xs font-medium", emp.late > 0 ? "text-amber-400" : "text-slate-500")}>
                              {emp.late}
                            </span>
                          </td>
                          <td className="p-2 text-center">
                            <span className={cn("text-xs font-medium", emp.absent > 0 ? "text-red-400" : "text-slate-500")}>
                              {emp.absent || 0}
                            </span>
                          </td>
                          <td className="p-2 text-center">
                            <div className="flex items-center gap-2 justify-center">
                              <div className="h-1.5 w-16 rounded-full bg-slate-700 overflow-hidden">
                                <div className={cn("h-full rounded-full", attendPct >= 80 ? "bg-green-500" : attendPct >= 50 ? "bg-amber-500" : "bg-red-500")}
                                  style={{ width: `${attendPct}%` }} />
                              </div>
                              <span className={cn("text-xs font-mono", attendPct >= 80 ? "text-green-400" : attendPct >= 50 ? "text-amber-400" : "text-red-400")}>
                                {attendPct}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* جدول تفصيلي */}
            <div className="rounded-xl border border-white/10 bg-card-bg p-5">
              <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-white">
                <List className="h-4 w-4 text-sky-400" /> سجل الحضور التفصيلي
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="p-3 text-right text-xs font-medium text-slate-400">التاريخ</th>
                      <th className="p-3 text-right text-xs font-medium text-slate-400">الكود</th>
                      <th className="p-3 text-right text-xs font-medium text-slate-400">الموظف</th>
                      <th className="p-3 text-right text-xs font-medium text-slate-400">القسم</th>
                      <th className="p-3 text-right text-xs font-medium text-slate-400">دخول</th>
                      <th className="p-3 text-right text-xs font-medium text-slate-400">خروج</th>
                      <th className="p-3 text-right text-xs font-medium text-slate-400">مدة العمل</th>
                      <th className="p-3 text-right text-xs font-medium text-slate-400">الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.map((r) => {
                      const emp = employees.find((e) => e.id === r.employeeId);
                      let workDuration = "--";
                      if (r.checkIn && r.checkOut) {
                        const diff = new Date(r.checkOut).getTime() - new Date(r.checkIn).getTime();
                        const hours = Math.floor(diff / 3600000);
                        const mins = Math.floor((diff % 3600000) / 60000);
                        workDuration = `${hours}h ${mins}m`;
                      }
                      return (
                        <tr key={r.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="p-3 text-white text-xs">{getDate(r.date)}</td>
                          <td className="p-3 text-slate-400 font-mono text-xs">{r.employeeCode}</td>
                          <td className="p-3 text-white text-sm">{r.employeeName}</td>
                          <td className="p-3 text-slate-400 text-xs">{emp?.department ?? "--"}</td>
                          <td className="p-3 text-white font-mono text-xs">{getTime(r.checkIn)}</td>
                          <td className="p-3 text-white font-mono text-xs">{getTime(r.checkOut)}</td>
                          <td className="p-3 text-slate-400 font-mono text-xs">{workDuration}</td>
                          <td className="p-3">
                            <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", ATTENDANCE_STATUS_COLORS[r.status])}>
                              {ATTENDANCE_STATUS_LABELS[r.status]}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {!reportFrom || !reportTo ? (
          <div className="rounded-xl border border-white/10 p-8 text-center">
            <FileSpreadsheet className="h-8 w-8 mx-auto mb-2 text-slate-600" />
            <p className="text-sm text-slate-400">اختر نطاق تاريخي لعرض التقرير</p>
          </div>
        ) : reportData.length === 0 ? (
          <div className="rounded-xl border border-white/10 p-8 text-center">
            <XCircle className="h-8 w-8 mx-auto mb-2 text-slate-600" />
            <p className="text-sm text-slate-400">لا توجد سجلات في هذا النطاق</p>
          </div>
        ) : null}
      </div>
    );
  }

  /* ── Render: Employee management ── */
  function renderEmployees() {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-sm text-slate-400">{employees.length} موظف</p>
          <Button onClick={openNewEmployee} className="gap-2">
            <Plus className="h-4 w-4" /> إضافة موظف
          </Button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="p-3 text-right text-xs font-medium text-slate-400">الكود</th>
                <th className="p-3 text-right text-xs font-medium text-slate-400">الاسم</th>
                <th className="p-3 text-right text-xs font-medium text-slate-400">القسم</th>
                <th className="p-3 text-right text-xs font-medium text-slate-400">المدة</th>
                <th className="p-3 text-center text-xs font-medium text-slate-400">جهاز البصمة</th>
                <th className="p-3 text-center text-xs font-medium text-slate-400">بصمة الجوال</th>
                <th className="p-3 text-right text-xs font-medium text-slate-400">الحالة</th>
                <th className="p-3 text-left text-xs font-medium text-slate-400">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {employees.length === 0 && (
                <tr><td colSpan={8} className="p-8 text-center text-slate-500">لا يوجد موظفون</td></tr>
              )}
              {employees.map((emp) => (
                <tr key={emp.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="p-3 text-white font-mono text-xs">{emp.code}</td>
                  <td className="p-3 text-white">{emp.name}</td>
                  <td className="p-3 text-slate-400">{emp.department}</td>
                  <td className="p-3 text-slate-400 text-xs font-mono">{emp.workStart || "08:00"} – {emp.workEnd || "16:00"}</td>
                  <td className="p-3 text-center">
                    {emp.zkEnrolled ? (
                      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium border border-green-500/30 bg-green-500/10 text-green-400">
                        <CheckCircle2 className="h-3 w-3" /> مسجلة
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium border border-slate-600 text-slate-500">
                        <XCircle className="h-3 w-3" /> غير مسجلة
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    {employeeService.hasBiometric(emp.id) ? (
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-xs text-green-400 border border-green-500/30 bg-green-500/10 rounded-full px-2 py-0.5">مسجلة</span>
                        <button onClick={() => handleRemoveBiometric(emp.id, emp.name)}
                          className="text-xs text-red-400 hover:text-red-300 ml-1" title="إزالة البصمة">✕</button>
                      </div>
                    ) : (
                      <button onClick={() => handleRegisterBiometric(emp.id)}
                        disabled={saving}
                        className="rounded-lg bg-sky-600/60 px-2 py-1 text-xs text-white hover:bg-sky-600 transition-colors disabled:opacity-50">
                        {saving ? "..." : "تسجيل"}
                      </button>
                    )}
                  </td>
                  <td className="p-3">
                    <button onClick={() => toggleEmployeeStatus(emp.id, emp.isActive)}
                      className={cn("rounded-full px-2 py-0.5 text-xs font-medium border", emp.isActive ? "text-green-400 border-green-500/30 bg-green-500/10" : "text-red-400 border-red-500/30 bg-red-500/10")}>
                      {emp.isActive ? "نشط" : "غير نشط"}
                    </button>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2 justify-end" dir="ltr">
                      <button onClick={() => openEditEmployee(emp)} className="rounded-lg p-1.5 text-slate-400 hover:text-sky-400 hover:bg-white/5 transition-colors">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => deleteEmployee(emp.id, emp.name)} className="rounded-lg p-1.5 text-slate-400 hover:text-red-400 hover:bg-white/5 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  /* ── WebAuthn — تسجيل/إزالة بصمة الجوال ── */
  async function handleRegisterBiometric(empId: string) {
    setSaving(true);
    try {
      await employeeService.registerBiometric(empId);
      loadData();
      showMsg("success", "تم تسجيل بصمة الجوال بنجاح");
    } catch (err: any) {
      showMsg("error", err?.message || "فشل تسجيل البصمة");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemoveBiometric(empId: string, empName: string) {
    if (!confirm(`هل أنت متأكد من إزالة بصمة "${empName}"؟`)) return;
    try {
      await employeeService.removeBiometric(empId);
      loadData();
      showMsg("success", "تم إزالة بصمة الجوال");
    } catch (err: any) {
      showMsg("error", err?.message || "فشلت العملية");
    }
  }

  /* ── ZK Device ── */
  async function handleZkConnect() {
    if (!zkIp.trim()) { showMsg("error", "أدخل IP الجهاز"); return; }
    const ip = zkIp.trim();
    localStorage.setItem("jarash_zk_ip", ip);
    setZkSyncing(true);

    // الخطوة 1: ping — هل الجهاز موجود على الشبكة؟
    showMsg("success", "جاري التحقق من وجود الجهاز على الشبكة...");
    try {
      const ping = await zkBridgeService.ping(ip);
      if (!ping.reachable) {
        const detail = ping.detail;
        if (detail?.reason === "TIMEOUT") {
          showMsg("error", `⛔ الجهاز ${ip} غير متجاوب (تايم أوت 3 ثوان).\n\nتأكد من:
1️⃣  الجهاز متصل بالكهرباء وشغال
2️⃣  IP الجهاز صحيح (يظهر على شاشة الجهاز)
3️⃣  الكمبيوتر والجهاز على نفس الشبكة`);
        } else if (detail?.reason === "ECONNREFUSED") {
          showMsg("error", `⛔ الجهاز ${ip} يرفض الاتصال. قد يكون متصلاً ببرنامج آخر.\n\nحاول إعادة تشغيل الجهاز (فصل الطاقة 10 ثوان).`);
        } else {
          showMsg("error", `⛔ الجهاز ${ip} غير قابل للوصول (${detail?.reason || "خطأ غير معروف"}).\n\nافتح PowerShell وجرب: ping ${ip}`);
        }
        setZkSyncing(false);
        return;
      }
    } catch (pingErr) {
      // سيرفر البصمة نفسه غير شغال
      showMsg("error", `❌ سيرفر البصمة غير شغال!\n\nسيرفر البصمة يشتغل تلقائياً مع:\nnode serve.cjs\n\nأعد تشغيل السيرفر الرئيسي، أو شغّله منفصلاً:\ncd src/Jarash.Web\nnode server/zk-bridge.mjs`);
      setZkSyncing(false);
      return;
    }

    // الخطوة 2: اتصال عبر بروتوكول ZK
    showMsg("success", `✅ الجهاز موجود! جاري الاتصال عبر بروتوكول ZK...`);
    try {
      const result = await zkBridgeService.connect(ip);
      setZkConnected(true);
      const info = await zkBridgeService.getInfo();
      setZkInfo(info.deviceName || info.serial || "متصل");
      showMsg("success", `✅ متصل بجهاز البصمة (${info.deviceName || info.serial || ip})`);
    } catch (err) {
      const msg = (err?.message || "");
      if (msg.includes("ZK_BRIDGE")) {
        showMsg("error", `❌ سيرفر البصمة غير شغال!\n\nأعد تشغيل السيرفر الرئيسي:\nnode serve.cjs`);
      } else {
        showMsg("error", msg || "فشل الاتصال ببروتوكول ZK — راجع تعليمات الصفحة");
      }
      setZkConnected(false);
    } finally {
      setZkSyncing(false);
    }
  }

  async function handleZkDisconnect() {
    try {
      await zkBridgeService.disconnect();
      setZkConnected(false);
      setZkInfo(null);
      showMsg("success", "تم قطع الاتصال");
    } catch (err) {
      showMsg("error", "فشل قطع الاتصال");
    }
  }

  async function handleZkSyncUsers() {
    setZkSyncing(true);
    try {
      const result = await zkBridgeService.syncUsers();
      showMsg("success", `تمت المزامنة: ${result.added} موظف جديد، ${result.matched} مطابق`);
      loadData();
    } catch (err) {
      showMsg("error", "فشل مزامنة الموظفين: " + (err?.message || ""));
    } finally {
      setZkSyncing(false);
    }
  }

  async function handleZkSyncAttendance() {
    setZkSyncing(true);
    try {
      const result = await zkBridgeService.syncAttendance();
      showMsg("success", `تمت المزامنة: ${result.synced} بصمة، ${result.skipped} تم تخطيها`);
      loadData();
    } catch (err) {
      showMsg("error", "فشل مزامنة البصمات: " + (err?.message || ""));
    } finally {
      setZkSyncing(false);
    }
  }

  /* ── ZK Enroll Fingerprint for an Employee ── */
  async function handleZkEnroll(emp: Employee) {
    if (!zkConnected) { showMsg("error", "جهاز البصمة غير متصل. اتصل أولاً."); return; }
    setSaving(true);
    try {
      // 1. احصل على UID أو استخدم التالي
      const uid = emp.zkUid || employeeService.getNextUid();
      // 2. أضف الموظف إلى الجهاز
      await zkBridgeService.setDeviceUser(uid, emp.code, emp.name);
      // 3. حدّث UID في النظام
      await employeeService.update(emp.id, { zkUid: uid });
      // 4. أرسل أمر تسجيل البصمة
      await zkBridgeService.enrollFingerprint(uid);
      showMsg("success", `✅ تم إرسال أمر تسجيل البصمة لـ ${emp.name}.\nضع إصبعه على الجهاز الآن.`);

      // 5. انتظر 30 ثانية وحدّث الحالة
      setTimeout(async () => {
        const users = await zkBridgeService.getUsers();
        const found = users.find((u: any) => String(u.userid) === emp.code);
        if (found) {
          await employeeService.update(emp.id, { zkEnrolled: true, zkUid: uid });
          loadData();
          showMsg("success", `✅ تم تسجيل بصمة ${emp.name} بنجاح`);
        }
      }, 15000);
    } catch (err: any) {
      showMsg("error", "فشل تسجيل البصمة: " + (err?.message || ""));
    } finally {
      setSaving(false);
    }
  }

  /* ── ZK Realtime Monitoring ── */
  async function handleStartRealtime() {
    if (!zkConnected) { showMsg("error", "جهاز البصمة غير متصل"); return; }
    if (realtimeRef.current) return;
    realtimeRef.current = true;
    setRealtimeActive(true);
    showMsg("success", "🟢 بدء المراقبة الحية — انتظار بصمات الموظفين...");

    zkBridgeService.startRealtime(async (event) => {
      const { userId, timestamp } = event;
      const emp = employeeService.getByCode(userId);
      const empName = emp?.name || `كود ${userId}`;

      // سجل الحدث في اللوق
      setRealtimeLog((prev) => {
        const next = [{ userId, timestamp, employeeName: empName }, ...prev];
        return next.slice(0, 100); // آخر 100 حدث
      });

      // سجل الحضور/الانصراف تلقائياً
      if (emp) {
        try {
          const record = await attendanceRecordService.recordFromZk(emp.id, emp.name, emp.code, timestamp);
          const time = new Date(record.checkIn || record.checkOut || timestamp).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" });
          if (record.checkIn && !record.checkOut) {
            showMsg("success", `✅ ${emp.name} — دخول ${time}`);
          } else if (record.checkOut) {
            showMsg("success", `✅ ${emp.name} — خروج ${time}`);
          }
          loadData();
        } catch (recErr: any) {
          if (recErr.message === "مكرر" || recErr.message === "مكتمل") {
            // تجاهل التكرار بصمت
          } else {
            showMsg("error", `❌ ${empName}: ${recErr.message}`);
          }
        }
      }
    });
  }

  function handleStopRealtime() {
    zkBridgeService.stopRealtime();
    realtimeRef.current = false;
    setRealtimeActive(false);
    showMsg("success", "🔴 تم إيقاف المراقبة الحية");
  }

  function renderDevice() {
    return (
      <div className="max-w-2xl space-y-6">
        <div className="rounded-xl border border-white/10 bg-card-bg p-6 shadow-sm">
          <h4 className="mb-4 flex items-center gap-2 text-sm font-bold text-white">
            <Server className="h-4 w-4 text-sky-400" /> إعدادات جهاز البصمة
          </h4>
          <div className="mb-4 flex items-center gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-slate-400">IP الجهاز</label>
              <input value={zkIp} onChange={(e) => setZkIp(e.target.value)} placeholder="مثال: 192.168.1.201"
                className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm outline-none focus:border-sky-500 font-mono" dir="ltr" />
            </div>
            <div className="pt-5">
              {zkConnected ? (
                <button onClick={handleZkDisconnect} className="flex items-center gap-1 rounded-lg bg-red-600/80 px-4 py-2 text-sm text-white hover:bg-red-600 transition-colors">
                  <WifiOff className="h-4 w-4" /> قطع الاتصال
                </button>
              ) : (
                <button onClick={handleZkConnect} disabled={zkSyncing || !zkIp.trim()}
                  className="flex items-center gap-1 rounded-lg bg-sky-600 px-4 py-2 text-sm text-white hover:bg-sky-700 transition-colors disabled:opacity-50">
                  {zkSyncing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Wifi className="h-4 w-4" />}
                  {zkSyncing ? "جاري الاتصال..." : "اتصال"}
                </button>
              )}
            </div>
          </div>
          {zkConnected && (
            <div className="rounded-lg bg-green-500/10 border border-green-500/20 px-4 py-2 text-sm text-green-400">
              متصل ← {zkInfo || zkIp}
            </div>
          )}
        </div>

        {zkConnected && (
          <>
            <div className="rounded-xl border border-white/10 bg-card-bg p-6 shadow-sm">
              <h4 className="mb-4 text-sm font-bold text-white">
                <Activity className="h-4 w-4 inline text-sky-400 ml-2" />
                المراقبة الحية — بصمات مباشرة
              </h4>
              <div className="flex flex-wrap gap-3 mb-4">
                {realtimeActive ? (
                  <button onClick={handleStopRealtime}
                    className="flex items-center gap-2 rounded-lg bg-red-600/80 px-4 py-2 text-sm text-white hover:bg-red-600 transition-colors">
                    <WifiOff className="h-4 w-4" /> إيقاف المراقبة
                  </button>
                ) : (
                  <button onClick={handleStartRealtime} disabled={zkSyncing}
                    className="flex items-center gap-2 rounded-lg bg-green-600/80 px-4 py-2 text-sm text-white hover:bg-green-600 transition-colors disabled:opacity-50">
                    <Wifi className="h-4 w-4" /> {zkSyncing ? "جاري..." : "▶ بدء المراقبة الحية"}
                  </button>
                )}
              </div>
              {realtimeActive && (
                <div className="rounded-lg bg-green-500/10 border border-green-500/20 px-4 py-2 text-xs text-green-400 flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                  مستمع — البصمات تُسجل تلقائياً
                </div>
              )}
              {realtimeLog.length > 0 && (
                <div className="mt-3 max-h-40 overflow-y-auto space-y-1">
                  {realtimeLog.slice(0, 20).map((ev, i) => {
                    const t = new Date(ev.timestamp).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
                    return (
                      <div key={i} className="flex items-center gap-2 text-xs text-slate-300 bg-white/5 rounded px-2 py-1">
                        <Fingerprint className="h-3 w-3 text-sky-400" />
                        <span className="font-mono text-sky-300">{t}</span>
                        <span>{ev.employeeName}</span>
                      </div>
                    );
                  })}
                </div>
              )}
              {realtimeLog.length === 0 && realtimeActive && (
                <p className="mt-3 text-xs text-slate-500">بانتظار أول بصمة...</p>
              )}
            </div>

            <div className="rounded-xl border border-white/10 bg-card-bg p-6 shadow-sm">
              <h4 className="mb-4 text-sm font-bold text-white">تسجيل بصمة موظف</h4>
              <p className="mb-3 text-xs text-slate-400">اختر موظفاً وأرسل أمر تسجيل بصمته على الجهاز</p>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {employees.filter((e) => e.isActive).map((emp) => (
                  <div key={emp.id} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
                    <div>
                      <span className="text-sm text-white">{emp.name}</span>
                      <span className="mr-2 text-xs text-slate-500 font-mono">{emp.code}</span>
                      {emp.zkEnrolled && <span className="mr-2 text-xs text-green-400">✅</span>}
                    </div>
                    <button onClick={() => handleZkEnroll(emp)} disabled={saving || zkSyncing}
                      className={cn("rounded-lg px-3 py-1 text-xs font-medium transition-colors disabled:opacity-50",
                        emp.zkEnrolled
                          ? "bg-purple-600/60 text-purple-200 hover:bg-purple-600"
                          : "bg-sky-600/80 text-white hover:bg-sky-600")}>
                      {saving ? "جاري..." : emp.zkEnrolled ? "إعادة تسجيل" : "تسجيل بصمة"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
          <h4 className="mb-2 flex items-center gap-2 text-sm font-bold text-amber-400"><AlertTriangle className="h-4 w-4" /> تعليمات خطوة بخطوة</h4>
          <div className="space-y-3 text-xs text-slate-400">
            <div>
              <p className="mb-1 font-semibold text-amber-300">🟢 الخطوة 0 — شغّل سيرفر البصمة</p>
              <p>افتح نافذة PowerShell منفصلة ← شغّل:</p>
              <code className="block rounded bg-white/10 px-2 py-1 font-mono text-sky-300 mt-1">node server/zk-bridge.mjs</code>
              <p className="mt-1">يجب أن ترى رسالة تشغيل السيرفر. السيرفر يعمل في هذه النافذة.</p>
            </div>
            <div>
              <p className="mb-1 font-semibold text-amber-300">🟢 الخطوة 1 — تأكد من الشبكة</p>
              <p>الجهاز والكمبيوتر يجب أن يكونا على <strong>نفس الشبكة</strong> (نفس الراوتر).</p>
              <p className="mt-1">إن كان الجهاز مربوطاً بكابل LAN مباشر (بدون راوتر):</p>
              <code className="block rounded bg-white/10 px-2 py-1 font-mono text-sky-300 mt-1">ping 192.168.1.201</code>
              <p className="mt-1">جرب ping من PowerShell كمسؤول. إذا لم يرد ← تأكد من الكابل.</p>
            </div>
            <div>
              <p className="mb-1 font-semibold text-amber-300">🟢 الخطوة 2 — أدخل IP ← اتصل</p>
              <p>IP الجهاز الافتراضي: <strong>192.168.1.201</strong> (يظهر على شاشة الجهاز نفسه).</p>
            </div>
            <div>
              <p className="mb-1 font-semibold text-amber-300">🟢 الخطوة 3 — مزامنة</p>
              <p>"مزامنة الموظفين" ← "مزامنة البصمات" ← تقارير الحضور</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Employee Form Dialog ── */
  function renderEmpFormDialog() {
    if (!showEmpForm) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowEmpForm(false)}>
        <div className="mx-4 w-full max-w-md rounded-2xl border border-white/10 bg-card-bg p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">{editEmpId ? "تعديل موظف" : "إضافة موظف جديد"}</h3>
            <button onClick={() => setShowEmpForm(false)} className="text-slate-400 hover:text-white transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs text-slate-400">بدء العمل</label>
                <input type="time" value={empForm.workStart} onChange={(e) => setEmpForm((p) => ({ ...p, workStart: e.target.value }))}
                  className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-sky-500 font-mono" dir="ltr" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-400">نهاية العمل</label>
                <input type="time" value={empForm.workEnd} onChange={(e) => setEmpForm((p) => ({ ...p, workEnd: e.target.value }))}
                  className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-sky-500 font-mono" dir="ltr" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs text-slate-400">الاسم *</label>
                <input value={empForm.name} onChange={(e) => setEmpForm((p) => ({ ...p, name: e.target.value }))}
                  className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-sky-500" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-400">الكود *</label>
                <input value={empForm.code} onChange={(e) => setEmpForm((p) => ({ ...p, code: e.target.value }))}
                  className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-sky-500 font-mono" dir="ltr" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">القسم</label>
              <select value={empForm.department} onChange={(e) => setEmpForm((p) => ({ ...p, department: e.target.value }))}
                className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-sky-500">
                {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            {empFormError && <p className="text-xs text-red-400">{empFormError}</p>}
            <div className="flex gap-2 pt-2">
              <Button onClick={saveEmployee} disabled={saving} className="flex-1">
                {saving ? "جاري الحفظ..." : editEmpId ? "تحديث" : "إضافة"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowEmpForm(false)}>إلغاء</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Main Render ── */
  return (
    <div className="flex h-full flex-col p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">نظام بصمة الحضور والانصراف</h2>
        <p className="mt-1 text-sm text-slate-400">تسجيل ومتابعة حضور وانصراف الموظفين</p>
      </div>

      {message && (
        <div className={cn("mb-4 rounded-xl border p-3 text-sm", message.type === "success" ? "border-green-500/30 bg-green-500/10 text-green-400" : "border-red-500/30 bg-red-500/10 text-red-400")}>
          {message.text}
        </div>
      )}

      <div className="mb-6 flex gap-1 border-b border-slate-700">
        {TABS.map((tab) => {
          const TabIcon = tab.icon;
          const isActive = view === tab.id;
          return (
            <button key={tab.id} onClick={() => setView(tab.id)}
              className={cn("flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative",
                isActive ? "text-sky-400" : "text-slate-500 hover:text-slate-300")}>
              <TabIcon className="h-4 w-4" />
              <span>{tab.label}</span>
              {isActive && <span className="absolute bottom-0 right-0 left-0 h-0.5 bg-sky-500 rounded-full" />}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-auto">
        {view === "checkin" && renderCheckIn()}
        {view === "log" && renderLog()}
        {view === "report" && renderReport()}
        {view === "employees" && renderEmployees()}
        {view === "device" && renderDevice()}
      </div>

      {renderEmpFormDialog()}
    </div>
  );
}
