const http = require("http");
const fs = require("fs");
const path = require("path");
const os = require("os");
const cp = require("child_process");

const dist = path.join(__dirname, "src", "Jarash.Web", "dist");
const dataDir = path.join(__dirname, "data");
const storageFile = path.join(dataDir, "storage.json");
const port = 3000;

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(storageFile)) fs.writeFileSync(storageFile, "{}", "utf-8");

const types = {
  ".html": "text/html;charset=utf-8",
  ".js": "text/javascript;charset=utf-8",
  ".css": "text/css;charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

let storageCache = null;
function readStore() {
  if (storageCache) return storageCache;
  try { storageCache = JSON.parse(fs.readFileSync(storageFile, "utf-8")); return storageCache; } catch { return {}; }
}
function writeStore(data) { storageCache = data; fs.writeFileSync(storageFile, JSON.stringify(data, null, 2), "utf-8"); }
function sendJson(res, status, data) { const b = JSON.stringify(data); res.writeHead(status, { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(b) }); res.end(b); }
function parseBody(req) { return new Promise((r) => { let b = ""; req.on("data", (c) => b += c); req.on("end", () => { try { r(JSON.parse(b)); } catch { r(null); } }); }); }

const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") { res.writeHead(204); return res.end(); }

  const url = new URL(req.url, `http://localhost:${port}`);
  const pathname = url.pathname;
  const method = req.method;

  try {
    if (pathname === "/api/sync" && method === "GET") {
      const store = readStore();
      return sendJson(res, 200, store);
    }

    const keyMatch = pathname.match(/^\/api\/sync\/(.+)$/);
    if (keyMatch) {
      const key = decodeURIComponent(keyMatch[1]);
      const store = readStore();
      if (method === "GET") return sendJson(res, 200, { key, value: store[key] ?? null });
      if (method === "PUT") { const body = await parseBody(req); store[key] = body; writeStore(store); console.log(`  \u{1F4BE} Sync: data written — ${key}`); return sendJson(res, 200, { ok: true }); }
      if (method === "DELETE") { delete store[key]; writeStore(store); return sendJson(res, 200, { ok: true }); }
    }

    /* ── Proxy: zk-bridge ── */
    if (pathname.startsWith("/api/zk")) {
      const zkPath = pathname.replace(/^\/api\/zk/, "/api");
      const zkUrl = `http://127.0.0.1:5174${zkPath}${url.search}`;
      return new Promise((resolve) => {
        const proxyReq = http.request(zkUrl, { method: req.method, headers: { "Content-Type": req.headers["content-type"] || "application/json" } }, (proxyRes) => {
          res.writeHead(proxyRes.statusCode, { "Access-Control-Allow-Origin": "*", "Content-Type": proxyRes.headers["content-type"] || "application/json" });
          proxyRes.pipe(res);
          proxyRes.on("end", resolve);
        });
        proxyReq.on("error", () => { sendJson(res, 502, { error: "جهاز البصمة غير شغال — شغّل: node server/zk-bridge.mjs" }); resolve(); });
        req.pipe(proxyReq);
      });
    }

    /* ── Static files + SPA ── */
    const hasExt = path.extname(pathname);
    let filePath = pathname === "/" || !hasExt ? "/index.html" : pathname;
    filePath = path.normalize(filePath).replace(/^(\.\.(\/|\\|$))+/g, "");
    const p = path.join(dist, filePath);

    if (!p.startsWith(dist)) { res.writeHead(403); return res.end(); }

    if (!fs.existsSync(p)) {
      if (!hasExt) {
        const indexFile = path.join(dist, "index.html");
        if (fs.existsSync(indexFile)) {
          res.writeHead(200, { "Content-Type": "text/html;charset=utf-8" });
          return fs.createReadStream(indexFile).pipe(res);
        }
      }
      res.writeHead(404);
      return res.end();
    }

    const ext = path.extname(p);
    res.writeHead(200, { "Content-Type": types[ext] || "application/octet-stream" });
    fs.createReadStream(p).pipe(res);
  } catch (err) {
    console.error("  \u{274C} Server error:", err.message);
    sendJson(res, 500, { error: err.message });
  }
});

function startZkB() {
  const zkPath = path.join(__dirname, "src", "Jarash.Web", "server", "zk-bridge.mjs");
  if (!fs.existsSync(zkPath)) return;
  const zkNodeModules = path.join(__dirname, "src", "Jarash.Web", "node_modules");
  try {
    require.resolve("zkteco-js", { paths: [zkNodeModules] });
  } catch {
    console.log("  zkteco-js غير مثبت — البصمة غير متوفرة. شغّل: cd src/Jarash.Web && npm install");
    return;
  }
  const zkIp = process.env.ZK_IP || "";
  const args = [zkPath];
  if (zkIp) args.push(`--ip=${zkIp}`);
  const zkProc = cp.spawn("node", args, { stdio: ["ignore", "inherit", "inherit"], windowsHide: true, env: { ...process.env, NODE_PATH: zkNodeModules } });
  zkProc.on("error", () => {});
  zkProc.on("exit", (c) => { if (c !== 0 && c !== null) console.log(`  zk-bridge توقف (${c}) — بصمة ZKTeco غير متوفرة`); if (c === 0) console.log(`  جهاز البصمة: شغّال`); });
  setTimeout(() => {
    const r = http.get("http://127.0.0.1:5174/api/status", (res) => { if (res.statusCode === 200) { console.log(`  جهاز البصمة: شغّال`); if (zkIp) console.log(`  IP الجهاز: ${zkIp}`); } });
    r.on("error", () => {}); r.setTimeout(2000, () => r.destroy());
  }, 2000);
}

let zkBStarted = false;

function tryListen(n) {
  const p = port + n;
  server.listen(p, () => {
    const ifaces = os.networkInterfaces();
    console.log(`\n  روابط الاتصال من الجوال (بورت ${p}):`);
    for (const name of Object.keys(ifaces))
      for (const iface of ifaces[name])
        if (iface.family === "IPv4" && !iface.internal && !name.match(/Loopback|Bluetooth|Hyper-V|VirtualBox|Docker|vEthernet|Tailscale/i))
          console.log(`      http://${iface.address}:${p}`);
    console.log(`      http://localhost:${p}\n`);
    if (n > 0) console.log(`  البورت ${port} كان مشغولاً — استخدمت ${p}`);
    if (!zkBStarted) { zkBStarted = true; startZkB(); }
  });
  server.on("error", (err) => {
    if (err.code === "EADDRINUSE" && n < 5) { console.log(`  بورت ${p} مشغول — جرّب ${port + n + 1}...`); server.close(); tryListen(n + 1); }
    else { console.error(`  خطأ:`, err.message); process.exit(1); }
  });
}

tryListen(0);
