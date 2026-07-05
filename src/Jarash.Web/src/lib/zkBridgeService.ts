import { logger } from "./logger";
import { attendanceRecordService, employeeService } from "@/pages/attendance/attendanceService";

const BRIDGE_PORT = 5174;
const BRIDGE_URL = `http://${typeof window !== "undefined" ? window.location.hostname : "localhost"}:${BRIDGE_PORT}`;

let eventSource: EventSource | null = null;
let onAttendanceCallback: ((data: { userId: string; timestamp: string; date: string }) => void) | null = null;

async function fetchApi(path: string, options?: RequestInit) {
  try {
    const res = await fetch(`${BRIDGE_URL}${path}`, {
      ...options,
      headers: { "Content-Type": "application/json", ...options?.headers },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    logger.error("zkBridge: request failed", { path, error: err });
    throw err;
  }
}

export const zkBridgeService = {
  async getStatus() {
    return fetchApi("/api/status");
  },

  async ping(ip: string, port = 4370) {
    return fetchApi("/api/ping", {
      method: "POST",
      body: JSON.stringify({ ip, port }),
    });
  },

  async connect(ip: string, port = 4370) {
    return fetchApi("/api/connect", {
      method: "POST",
      body: JSON.stringify({ ip, port }),
    });
  },

  async disconnect() {
    return fetchApi("/api/disconnect", { method: "POST" });
  },

  async getInfo() {
    return fetchApi("/api/info");
  },

  async getUsers() {
    const data = await fetchApi("/api/users");
    return data.users || [];
  },

  async getAttendance() {
    const data = await fetchApi("/api/attendance");
    return data.logs || [];
  },

  async clearAttendance() {
    return fetchApi("/api/clear-attendance", { method: "POST" });
  },

  /**
   * تسجيل بصمة موظف على جهاز ZKTeco (إرسال أمر STARTENROLL)
   * يجب أن يكون الموظف مضافاً مسبقاً على الجهاز عبر setUser
   */
  async enrollFingerprint(uid: number) {
    return fetchApi("/api/enroll", {
      method: "POST",
      body: JSON.stringify({ uid }),
    });
  },

  async cancelEnroll() {
    return fetchApi("/api/cancel-enroll", { method: "POST" });
  },

  /** إضافة موظف إلى جهاز ZKTeco (setUser) */
  async setDeviceUser(uid: number, userid: string, name: string) {
    // setUser(uid, userid, name, password, role, cardno)
    return fetchApi("/api/set-user", {
      method: "POST",
      body: JSON.stringify({ uid, userid, name, password: "0000", role: 0 }),
    });
  },

  /* ── المراقبة الحية (SSE) ── */

  /** بدء الاستماع لبصمات الموظفين المباشرة */
  startRealtime(callback: (data: { userId: string; timestamp: string; date: string }) => void) {
    onAttendanceCallback = callback;
    if (eventSource) {
      eventSource.close();
    }
    eventSource = new EventSource(`${BRIDGE_URL}/api/realtime`);

    eventSource.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === "attendance" && data.userId) {
          callback(data);
        }
      } catch {}
    };

    eventSource.onerror = () => {
      // إعادة الاتصال تلقائياً بعد 3 ثوان
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
      setTimeout(() => {
        if (onAttendanceCallback) {
          this.startRealtime(onAttendanceCallback);
        }
      }, 3000);
    };

    logger.info("zkBridge: realtime started");
  },

  stopRealtime() {
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
    onAttendanceCallback = null;
    logger.info("zkBridge: realtime stopped");
  },

  isRealtimeConnected() {
    return eventSource !== null;
  },
};
