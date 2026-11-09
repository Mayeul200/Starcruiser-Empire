// Test headless Chromium du site Starcruiser-Empire.
// Usage :
//   npm install playwright-core   (dans un dossier, ex. /tmp/pwtest)
//   NODE_PATH=/tmp/pwtest/node_modules LD_LIBRARY_PATH=/tmp/debs/root/usr/lib/x86_64-linux-gnu node tools/headless-test.mjs
// (LD_LIBRARY_PATH = libs système extraites des .deb si Chromium manque de libglib etc.)
import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORT = 8123;

const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".svg": "image/svg+xml" };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split("?")[0]).replace(/^\/+/, "") || "index.html");
  const file = p.endsWith("/") ? path.join(p, "index.html") : p;
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); res.end("404"); return; }
    res.writeHead(200, { "Content-Type": MIME[path.extname(file)] || "application/octet-stream" });
    res.end(data);
  });
});
await new Promise((r) => server.listen(PORT, "127.0.0.1", r));

const require2 = createRequire(process.env.PLAYWRIGHT_DIR || "/tmp/pwtest/");
const { chromium } = require2("playwright-core");
const browser = await chromium.launch({ headless: true, args: ["--no-sandbox", "--use-gl=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

const errors = [];
const failed = [];
page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));
page.on("console", (m) => { if (m.type() === "error") errors.push("CONSOLE: " + m.text()); });
page.on("requestfailed", (r) => failed.push(r.url() + " -> " + (r.failure()?.errorText || "?")));

const t0 = Date.now();
await page.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: "load", timeout: 30000 });
await page.waitForTimeout(6000);

await page.evaluate(() => {
  window.__frames = 0;
  const loop = () => { window.__frames++; requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
});
await page.waitForTimeout(3000);

const stats = await page.evaluate(() => ({
  planets: document.querySelectorAll(".planet-btn").length,
  perf: document.getElementById("hud-perf")?.textContent || "",
  fatal: !document.getElementById("fatal-error")?.classList.contains("hidden"),
  frames: window.__frames || 0,
  webgl: !!document.querySelector("canvas"),
}));
const fps = Math.round((stats.frames / 3) * 10) / 10;
await page.screenshot({ path: "/tmp/starcruiser-test.png" });
await browser.close();
server.close();

console.log(JSON.stringify({
  loadMs: Date.now() - t0,
  fps,
  planets: stats.planets,
  perfHud: stats.perf,
  fatalOverlay: stats.fatal,
  canvas: stats.webgl,
  jsErrors: errors,
  failedRequests: failed.slice(0, 10),
  screenshot: "/tmp/starcruiser-test.png",
}, null, 2));

process.exit(errors.length > 0 || stats.fatal ? 1 : 0);
