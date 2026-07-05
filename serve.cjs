const http = require("http");
const fs = require("fs");
const path = require("path");
const os = require("os");

const dist = path.join(__dirname, "src", "Jarash.Web", "dist");
const port = 3000;

// Show IP addresses for mobile access
const ifaces = os.networkInterfaces();
console.log("\n  \u{1F4E1}  روابط الاتصال من الجوال:");
for (const name of Object.keys(ifaces)) {
  for (const iface of ifaces[name]) {
    if (iface.family === "IPv4" && !iface.internal &&
        !name.match(/Loopback|Bluetooth|Hyper-V|VirtualBox|Docker|vEthernet|Tailscale/i)) {
      console.log(`      \u{1F4F1}  http://${iface.address}:${port}`);
    }
  }
}
console.log(`      \u{1F4BB}  http://localhost:${port}\n`);

const types = {
  ".html": "text/html;charset=utf-8",
  ".js": "text/javascript;charset=utf-8",
  ".css": "text/css;charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

http.createServer((req, res) => {
  // CORS headers for mobile access
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    return res.end();
  }

  let file = req.url === "/" ? "index.html" : req.url.slice(1);
  file = path.normalize(file).replace(/^(\.\.(\/|\\|$))+/g, "");
  const p = path.join(dist, file);

  if (!p.startsWith(dist)) {
    res.writeHead(403);
    return res.end();
  }

  if (!fs.existsSync(p)) {
    res.writeHead(404);
    return res.end();
  }

  const ext = path.extname(p);
  res.writeHead(200, { "Content-Type": types[ext] || "application/octet-stream" });
  fs.createReadStream(p).pipe(res);
}).listen(port, () => console.log(`  ✅  السيرفر يعمل على:\n      http://localhost:${port}\n`));
