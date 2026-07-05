import http from "http";
import os from "os";
import net from "net";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const ZktecoJs = require("zkteco-js");
const { COMMANDS } = require("zkteco-js/src/helper/command.js");

const PORT = parseInt(process.env.ZK_BRIDGE_PORT || "5174");
const CLI_IP = process.argv.find((a) => a.startsWith("--ip="))?.split("=")[1] || process.env.ZK_IP || "";
let device = null;
let deviceIp = CLI_IP;
let devicePort = 4370;
let realtimeClients = [];
let isRealtimeRunning = false;

function log(msg) {
  console.log(`[ZK-Bridge] ${msg}`);
}

function sendJson(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(JSON.stringify(data));
}

function getBody(req) {
  return new Promise((resolve) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try { resolve(JSON.parse(body)); } catch { resolve({}); }
    });
  });
}

function pingDevice(ip, port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(3000);
    socket.on("connect", () => { socket.destroy(); resolve(true); });
    socket.on("error", (err) => { socket.destroy(); resolve({ reachable: false, reason: err.code || err.message }); });
    socket.on("timeout", () => { socket.destroy(); resolve({ reachable: false, reason: "TIMEOUT" }); });
    socket.connect(port, ip);
  });
}

async function ensureDevice(ip, port) {
  if (device && device.ip === ip && device.port === port) {
    try { await device.testConnection(); return device; } catch { log("جهاز البصمة: إعادة الاتصال..."); }
  }
  if (device) { try { await device.disconnect(); } catch {} }
  device = new ZktecoJs(ip, port, 5200, 5000);
  device.ip = ip;
  device.port = port;
  log(`محاولة الاتصال بجهاز البصمة على ${ip}:${port}...`);
  await device.createSocket();
  log(`✅ تم الاتصال بجهاز البصمة (${device.connectionType})`);
  return device;
}

function broadcastRealtime(event) {
  const data = JSON.stringify(event);
  for (const client of realtimeClients) {
    client.res.write(`data: ${data}\n\n`);
  }
}

async function startRealtimeMonitoring() {
  if (!device || isRealtimeRunning) return;
  isRealtimeRunning = true;
  log("بدء المراقبة الحية لبصمات الموظفين...");
  try {
    // Disable keypad so events come through
    await device.disableDevice();
    await device.getRealTimeLogs((event) => {
      if (event && event.userId) {
        const now = new Date();
        const dateStr = now.toISOString().split("T")[0];
        const timestamp = new Date(event.attTime).toISOString();
        log(`بصمة: user=${event.userId} time=${timestamp}`);
        broadcastRealtime({
          type: "attendance",
          userId: event.userId,
          timestamp,
          date: dateStr,
        });
      }
    });
  } catch (err) {
    log(`❌ فشل المراقبة الحية: ${err.message}`);
    isRealtimeRunning = false;
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const path = url.pathname;
  const method = req.method;

  if (method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    return res.end();
  }

  try {
    /* ── SSE endpoint للمراقبة الحية ── */
    if (path === "/api/realtime" && method === "GET") {
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
      });
      res.write(`data: ${JSON.stringify({ type: "connected" })}\n\n`);

      const client = { id: Date.now(), res };
      realtimeClients.push(client);
      log(`عميل جديد للمراقبة الحية (الإجمالي: ${realtimeClients.length})`);

      // Start real-time if not already running
      if (!isRealtimeRunning && device) {
        startRealtimeMonitoring();
      }

      req.on("close", () => {
        realtimeClients = realtimeClients.filter((c) => c.id !== client.id);
        log(`عميل قطع الاتصال (الإجمالي: ${realtimeClients.length})`);
        if (realtimeClients.length === 0 && isRealtimeRunning && device) {
          isRealtimeRunning = false;
          device.enableDevice().catch(() => {});
          log("إيقاف المراقبة الحية (لا يوجد عملاء)");
        }
      });
      return;
    }

    /* ── البصمة: تسجيل بصمة موظف على الجهاز ── */
    if (path === "/api/enroll" && method === "POST") {
      const body = await getBody(req);
      const uid = parseInt(body.uid);
      if (!uid || uid < 1 || uid > 3000) {
        sendJson(res, 400, { success: false, error: "UID يجب أن يكون بين 1 و 3000" });
        return;
      }
      if (!device) {
        sendJson(res, 400, { success: false, error: "الجهاز غير متصل. اتصل أولاً." });
        return;
      }

      log(`بدء تسجيل بصمة للمستخدم UID=${uid}...`);

      // Wait for any ongoing real-time to pause
      if (isRealtimeRunning) {
        await device.enableDevice();
        isRealtimeRunning = false;
      }

      // Send start enroll command via raw TCP
      const buf = Buffer.alloc(2);
      buf.writeUInt16LE(uid, 0);

      // Access the internal TCP connection to send the enroll command
      const connType = device.connectionType;
      const transport = connType === "tcp" ? device.ztcp : device.zudp;

      try {
        await transport.executeCmd(COMMANDS.CMD_STARTENROLL, buf);
        log(`✅ أمر تسجيل البصمة أُرسل للجهاز. المستخدم يضع إصبعه الآن.`);

        // Re-enable real-time after 30s timeout
        setTimeout(() => {
          if (device && !isRealtimeRunning && realtimeClients.length > 0) {
            startRealtimeMonitoring();
          }
        }, 30000);

        sendJson(res, 200, {
          success: true,
          message: "تم إرسال أمر تسجيل البصمة. ضع إصبعك على الجهاز.",
        });
      } catch (err) {
        // Restart real-time if it was running
        if (realtimeClients.length > 0) startRealtimeMonitoring();
        sendJson(res, 500, {
          success: false,
          error: `فشل تسجيل البصمة: ${err.message}`,
        });
      }
      return;
    }

    /* ── إلغاء التسجيل ── */
    if (path === "/api/cancel-enroll" && method === "POST") {
      if (device) {
        const transport = device.connectionType === "tcp" ? device.ztcp : device.zudp;
        try {
          await transport.executeCmd(COMMANDS.CMD_CANCELCAPTURE, Buffer.alloc(0));
        } catch {}
        if (realtimeClients.length > 0) startRealtimeMonitoring();
      }
      sendJson(res, 200, { success: true });
      return;
    }

    if (path === "/api/status" && method === "GET") {
      sendJson(res, 200, {
        status: device ? "connected" : "disconnected",
        ip: deviceIp,
        port: devicePort,
        realtime: isRealtimeRunning,
        clients: realtimeClients.length,
      });
      return;
    }

    if (path === "/api/ping" && method === "POST") {
      const body = await getBody(req);
      const pingIp = body.ip || "192.168.1.201";
      const pingPort = body.port || 4370;
      const result = await pingDevice(pingIp, pingPort);
      sendJson(res, 200, {
        reachable: result === true,
        ip: pingIp,
        port: pingPort,
        detail: result === true ? "ok" : result,
      });
      return;
    }

    if (path === "/api/connect" && method === "POST") {
      const body = await getBody(req);
      deviceIp = body.ip || deviceIp || "192.168.1.201";
      devicePort = body.port || 4370;

      const ping = await pingDevice(deviceIp, devicePort);
      if (ping !== true) {
        sendJson(res, 400, {
          success: false,
          error: ping.reason === "TIMEOUT"
            ? `الجهاز ${deviceIp} غير متجاوب — تأكد من:
  1. الجهاز والكمبيوتر على نفس الشبكة
  2. IP الجهاز صحيح
  3. إن كان مربوطاً بكابل مباشر — اجعل IP الكمبيوتر ثابتاً (192.168.1.x)`
            : ping.reason === "ECONNREFUSED"
              ? `الجهاز ${deviceIp} يرفض الاتصال — قد يكون مشغولاً ببرنامج آخر. أعد تشغيل الجهاز.`
              : `الجهاز ${deviceIp} غير قابل للوصول (${ping.reason})`,
        });
        return;
      }

      try {
        await ensureDevice(deviceIp, devicePort);
      } catch (connErr) {
        sendJson(res, 400, {
          success: false,
          error: `تم الاتصال بالشبكة لكن فشل بروتوكول ZK:\n→ ${connErr.message || connErr}\n\nالحلول:\n1. بعض الأجهزة تدعم اتصالاً واحداً فقط\n2. جرب إعادة تشغيل الجهاز\n3. تأكد أن الجهاز ليس في قائمة الإعدادات`,
        });
        return;
      }

      // Auto-start real-time monitoring after connect
      if (realtimeClients.length > 0) {
        startRealtimeMonitoring();
      }

      sendJson(res, 200, { success: true, ip: deviceIp, port: devicePort });
      return;
    }

    if (path === "/api/disconnect" && method === "POST") {
      if (device) {
        isRealtimeRunning = false;
        try { await device.enableDevice(); } catch {}
        try { await device.disconnect(); } catch {}
        device = null;
      }
      sendJson(res, 200, { success: true });
      return;
    }

    if (path === "/api/info" && method === "GET") {
      if (!deviceIp) {
        sendJson(res, 400, { error: "لم يتم تحديد IP الجهاز بعد. اتصل أولاً." });
        return;
      }
      const d = await ensureDevice(deviceIp, devicePort);
      const info = await safeExec(() => d.getInfo());
      const deviceName = await safeExec(() => d.getDeviceName());
      const serial = await safeExec(() => d.getSerialNumber());
      const version = await safeExec(() => d.getDeviceVersion());
      sendJson(res, 200, { info, deviceName, serial, version });
      return;
    }

    if (path === "/api/users" && method === "GET") {
      const d = await ensureDevice(deviceIp, devicePort);
      const users = await safeExec(() => d.getUsers());
      sendJson(res, 200, { users: Array.isArray(users) ? users : [] });
      return;
    }

    if (path === "/api/attendance" && method === "GET") {
      const d = await ensureDevice(deviceIp, devicePort);
      const logs = await safeExec(() => d.getAttendances());
      sendJson(res, 200, { logs: Array.isArray(logs) ? logs : [] });
      return;
    }

    if (path === "/api/clear-attendance" && method === "POST") {
      const d = await ensureDevice(deviceIp, devicePort);
      await safeExec(() => d.clearAttendanceLog());
      sendJson(res, 200, { success: true });
      return;
    }

    /* ── إضافة موظف إلى الجهاز (setUser) ── */
    if (path === "/api/set-user" && method === "POST") {
      const body = await getBody(req);
      const { uid, userid, name, password, role } = body;
      if (!uid || !userid) {
        sendJson(res, 400, { success: false, error: "uid و userid مطلوبان" });
        return;
      }
      if (!device) {
        sendJson(res, 400, { success: false, error: "الجهاز غير متصل" });
        return;
      }
      try {
        const d = await ensureDevice(deviceIp, devicePort);
        await d.setUser(parseInt(uid), String(userid), String(name || userid), String(password || "0000"), parseInt(role || "0"));
        log(`✅ تم إضافة المستخدم UID=${uid} userid=${userid} name=${name}`);
        sendJson(res, 200, { success: true, uid, userid });
      } catch (err) {
        sendJson(res, 500, { success: false, error: `فشل إضافة المستخدم: ${err.message}` });
      }
      return;
    }

    /* ── حذف مستخدم من الجهاز ── */
    if (path === "/api/delete-user" && method === "POST") {
      const body = await getBody(req);
      const uid = parseInt(body.uid);
      if (!uid) {
        sendJson(res, 400, { success: false, error: "uid مطلوب" });
        return;
      }
      if (!device) {
        sendJson(res, 400, { success: false, error: "الجهاز غير متصل" });
        return;
      }
      try {
        const d = await ensureDevice(deviceIp, devicePort);
        await d.deleteUser(uid);
        log(`✅ تم حذف المستخدم UID=${uid}`);
        sendJson(res, 200, { success: true });
      } catch (err) {
        sendJson(res, 500, { success: false, error: `فشل حذف المستخدم: ${err.message}` });
      }
      return;
    }

    sendJson(res, 404, { error: "Not Found" });
  } catch (err) {
    sendJson(res, 500, {
      error: err.message || "Unknown error",
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }
});

async function safeExec(fn) {
  try { return await fn(); } catch (err) { throw err; }
}

function showNetworkInterfaces() {
  const nets = os.networkInterfaces();
  console.log("\nبطاقات الشبكة المتاحة:");
  for (const [name, addrs] of Object.entries(nets)) {
    if (!addrs) continue;
    for (const addr of addrs) {
      if (addr.family === "IPv4" && !addr.internal) {
        console.log(`  ${name.padEnd(25)} ${addr.address}`);
      }
    }
  }
  console.log("");
}

server.listen(PORT, () => {
  console.log(`\n╔══════════════════════════════════════════╗`);
  console.log(`║     🖐️  ZK Bridge — سيرفر البصمة       ║`);
  console.log(`╠══════════════════════════════════════════╣`);
  console.log(`║  🎯 REST + SSE: http://localhost:${PORT}       ║`);
  console.log(`║  📡 الجهاز: ${(deviceIp || "لم يُحدد بعد").padEnd(28)}║`);
  console.log(`╚══════════════════════════════════════════╝\n`);
  showNetworkInterfaces();
  console.log(`للاتصال: node zk-bridge.mjs --ip=192.168.1.201\n`);

  if (deviceIp) {
    console.log(`محاولة الاتصال التلقائي بجهاز ZKTeco على ${deviceIp}:${devicePort}...`);
    ensureDevice(deviceIp, devicePort)
      .then(() => {
        console.log("✅ جهاز البصمة متصل!");
        if (realtimeClients.length > 0) startRealtimeMonitoring();
      })
      .catch((err) => console.warn(`⚠️  الجهاز غير قابل للوصول: ${err.message}`));
  }
});
